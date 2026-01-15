import { INOPS_CONFIG, requireSearchKey } from '../config/api'

function buildHeaders(searchKey) {
  return {
    'Content-Type': 'application/json',
    'X-Search-Key': searchKey,
    Authorization: `SearchKey ${searchKey}`,
  }
}

function extractWidgets(payload) {
  // Handle different event structures
  const env = payload?.data ?? payload
  // Try multiple paths: response.widgets, data.response.widgets, or direct widgets
  const widgets = 
    env?.response?.widgets ?? 
    env?.data?.response?.widgets ?? 
    (Array.isArray(env?.widgets) ? env.widgets : []) ??
    []
  return Array.isArray(widgets) ? widgets : []
}

function extractSummary(payload) {
  const widgets = extractWidgets(payload)
  const textW = widgets.find((w) => w && (w.type === 'text' || w.kind === 'text'))
  return String((textW && (textW.text || textW.value)) || '').trim()
}

function extractProducts(payload) {
  const widgets = extractWidgets(payload)
  return widgets.filter((w) => w && w.type === 'product')
}

export async function startFlow(userInput) {
  const searchKey = requireSearchKey()
  const url = `${INOPS_CONFIG.apiBaseUrl}/shop/flow/execute?searchKey=${encodeURIComponent(searchKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(searchKey),
    body: JSON.stringify({ language: 'en', userInput }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`flow.execute failed: ${res.status} ${res.statusText} ${txt}`.trim())
  }
  const json = await res.json().catch(() => null)
  const sessionId = String(json?.sessionId || json?.data?.sessionId || '').trim()
  if (!sessionId) throw new Error('flow.execute missing sessionId')
  return { sessionId }
}

export function subscribeToSession(sessionId, onEvent) {
  const searchKey = requireSearchKey()
  const ctrl = new AbortController()
  const qs = `?searchKey=${encodeURIComponent(searchKey)}`
  const url = `${INOPS_CONFIG.apiBaseUrl}/sse/session/${encodeURIComponent(sessionId)}${qs}`

  ;(async () => {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Search-Key': searchKey,
        Authorization: `SearchKey ${searchKey}`,
        Accept: 'text/event-stream',
      },
      signal: ctrl.signal,
    })
    if (!res.ok || !res.body) return

    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let lastEvent = null
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const parts = buf.split('\n')
      buf = parts.pop() || ''
      for (const line of parts) {
        const trimmed = String(line || '').trim()
        if (!trimmed) continue
        if (trimmed.startsWith('event:')) {
          lastEvent = trimmed.slice(6).trim() || null
          continue
        }
        if (trimmed.startsWith('data:')) {
          const raw = trimmed.slice(5).trim()
          if (raw === '[DONE]') continue
          let payload = raw
          try {
            payload = JSON.parse(raw)
          } catch {
            // ignore non-JSON payloads
          }
          try {
            const normalized =
              payload && (payload.event || payload.response || payload.data)
                ? payload
                : { event: lastEvent, data: payload }
            onEvent(normalized)
          } catch {
            // ignore user callback errors; keep stream alive
          }
        }
      }
    }
  })().catch(() => {
    // ignore stream errors; UI will timeout/handle empty results
  })

  return () => {
    try {
      ctrl.abort()
    } catch {
      // ignore abort errors
    }
  }
}

export async function runFlow(userInput, opts) {
  const timeoutMs = Number(opts?.timeoutMs || 30_000)
  const { sessionId } = await startFlow(userInput)

  let summary = ''
  let products = []
  const eventsSeen = new Set()
  const allEvents = [] // For debugging

  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        unsub()
      } catch {
        // ignore unsubscribe errors
      }
      console.warn('[runFlow] Timeout reached', { sessionId, eventsSeen: Array.from(eventsSeen), summary, productsCount: products.length, allEvents })
      reject(new Error('flow timeout'))
    }, timeoutMs)

    const unsub = subscribeToSession(sessionId, (evt) => {
      const ev = String(evt?.event || evt?.data?.event || '').trim()
      if (ev) eventsSeen.add(ev)
      
      // Debug logging
      allEvents.push({ event: ev, timestamp: new Date().toISOString(), payload: evt })
      const widgets = extractWidgets(evt)
      const extractedProducts = extractProducts(evt)
      console.log('[runFlow] SSE event:', ev, { 
        hasData: !!evt?.data, 
        hasResponse: !!evt?.response,
        widgetsCount: widgets?.length || 0,
        productsCount: extractedProducts?.length || 0,
        rawPayload: JSON.stringify(evt).substring(0, 200)
      })
      
      const nextSummary = extractSummary(evt)
      if (nextSummary) {
        summary = nextSummary
        console.log('[runFlow] Summary extracted:', summary.substring(0, 100))
      }
      
      // Handle products from 'products' or 'unranked-products' events
      if (ev === 'products' || ev === 'unranked-products' || extractedProducts.length > 0) {
        const nextProducts = extractedProducts
        if (nextProducts.length) {
          console.log('[runFlow] Products extracted:', nextProducts.length, nextProducts.map(p => ({ id: p?.productId || p?.id, title: p?.title || p?.name })))
          // Merge with existing products, avoiding duplicates
          const existingIds = new Set(products.map(p => p?.productId || p?.id))
          const newProducts = nextProducts.filter(p => {
            const id = p?.productId || p?.id
            return id && !existingIds.has(id)
          })
          products = [...products, ...newProducts]
        }
      }

      if (ev === 'flow-end' || ev === 'end') {
        clearTimeout(timer)
        try {
          unsub()
        } catch {
          // ignore unsubscribe errors
        }
        console.log('[runFlow] Flow ended', { sessionId, summary: summary.substring(0, 100), productsCount: products.length, eventsSeen: Array.from(eventsSeen) })
        resolve({ sessionId, summary, products, eventsSeen: Array.from(eventsSeen), debug: { allEvents } })
      }
      // Many runs emit products before flow-end; resolve once we have products and a summary.
      if (products.length && summary) {
        clearTimeout(timer)
        try {
          unsub()
        } catch {
          // ignore unsubscribe errors
        }
        console.log('[runFlow] Early resolve (products + summary)', { sessionId, productsCount: products.length })
        resolve({ sessionId, summary, products, eventsSeen: Array.from(eventsSeen), debug: { allEvents } })
      }
    })
  })
}

