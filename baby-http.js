import { createServer } from "node:net"

/**
 * Minimal http server.
 *
 * Response looks like:
 *
 * ------------------
 * HTTP/1.0 200 OK
 * Content-Type: text/html; charset=utf-8
 *
 * <h1>Hi! 👋</h1><p>I'm a web page.</p>
 * ------------------
 */

let response =
    "HTTP/1.0 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<h1>Hi! 👋</h1><p>I'm a web page.</p>"

createServer(async (socket) => {
    socket.end(response)
}).listen(49000)
