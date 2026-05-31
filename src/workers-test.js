export default {
  async fetch(request, env) {
    return new Response(JSON.stringify({ ok: true, url: request.url }), {
      headers: { 'content-type': 'application/json' }
    })
  }
}
