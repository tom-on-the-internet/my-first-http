/**********************************************************************************
 *
 *  Oh, welcome! 👋 So, in here we are using TCP streams to create an HTML server.
 *
 *  This functioning server parses incoming tcp streams which comply with
 *  the HTTP protocol. It then determines how to respond and send back a working,
 *  if limited, HTTP response (Headers and Body).
 *
 *  I have not factored this code at all. I try to create things where I use them.
 *  The goal is to make this easy to read. The goal is not to make this code good.
 *
 *  This is NOT production ready or safe code. It's a toy, a curiosity, a marvel.
 *
 **********************************************************************************/

import { createServer } from "node:net"
import { readFile } from "fs/promises"
import { fileURLToPath } from "url"

/**
 * Get the contents of this file and prepare it for viewing in an HTML document.
 * Someone might be reading this text in an HTML document right now!
 * We do this before starting the server so we only have to do it once, not on
 * every request. It's highly unlikely this code would change while the server
 * is running. 😂
 */

let currentFilePath = fileURLToPath(import.meta.url)
let fileContents = await readFile(currentFilePath, "utf8")
// Here we replace special symbols that the browser would interpret as HTML symbols.
let escapedContents = fileContents
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

/**
 * We are going to turn this TCP server into an HTTP server.
 * Instead of receiving a parsed HTTP Request, we accept socket connections,
 * read the stream, and parse it into an HTTP Request. Then we build an
 * HTTP response which should be good enough for the client to parse.
 */
let myTcpServer = createServer(async (socket) => {
    console.log("  Client connected to TCP server  .")

    socket.on("close", () => {
        console.log("  TCP Server connection ended with Client  .")
        console.log(`  Read ${socket.bytesRead} bytes.`)
        console.log(`  Wrote ${socket.bytesWritten} bytes.`)
        console.log(``)
    })

    /**
     * These variables hold the state for our current socket.
     * As we parse the incoming stream, we'll assign these variable proper
     * values.
     */

    let requestData = "" // will hold the incoming data as a string.
    let method = null // eg. GET or POST
    let path = null // eg. / or /favicon.ico
    let protocol = null // eg. HTTP/1.0   We ignore this because we are too limited to care.
    let requestHeaders = null // eg. [{key: "Accept-encoding", value: "gzip, deflate, br, zstd"}]
    let requestHeadersLength = null // eg. 50   The length, in bytes, of the request headers sent by the client.

    for await (let chunk of socket) {
        requestData += chunk.toString()
        if (!requestData.includes("\r\n\r\n")) {
            // the headers aren't done yet.
            // let's await the next chunk
            continue
        }

        // parse the headers if not already parsed
        if (requestHeaders === null) {
            let [headerData] = requestData.split("\r\n\r\n")

            // we'll need this for determining how much of the body
            // we've received later
            requestHeadersLength = headerData.length

            let headerLines = headerData.split("\r\n")

            // The start line will look like:
            // GET /some-path HTTP/1.1
            let startLine = headerLines[0].split(" ")

            // split up the
            method = startLine[0]
            path = startLine[1]
            protocol = startLine[2]

            headerLines.shift()

            requestHeaders = headerLines.reduce((acc, curr) => {
                let [key, value] = curr.split(": ").map((part) => part.trim())
                acc[key] = value
                return acc
            }, {})
        }

        /**
         * Log the request.
         */
        console.log(
            `  TCP Server parsed request method and path as ${method} ${path} .`
        )

        // If it's a GET method, we don't have to worry about parsing a body,
        // so that means there's nothing left to await because we already have
        // the headers.
        if (method === "GET") {
            /**
             * Home page 📃
             */
            if (path === "/") {
                const MY_HOME_PAGE = [
                    "HTTP/1.0 200 OK",
                    "Content-Type: text/html; charset=utf-8",
                    "",
                    `
<!doctype html>
<html>
    <head>
        <style>
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(
                    135deg,
                    #303446 25%,
                    #1e2030 50%,
                    #292c3c 75%
                );
                background-size: 400% 400%;
                min-height: 100vh;
                animation: gradientBG 5s ease infinite;
                color: #c6d0f5;
            }

            @keyframes gradientBG {
                0% {
                    background-position: 0% 50%;
                }
                50% {
                    background-position: 100% 50%;
                }
                100% {
                    background-position: 0% 50%;
                }
            }

            main {
                max-width: 65ch;
                margin: 0 auto;
                padding: 1rem;
            }

            h1,
            h2,
            h3 {
                font-weight: 600;
                margin-bottom: 1rem;
                color: #f2d5cf;
            }
            h1 {
                text-align: center;
            }

            a {
                color: #8caaee;
                text-decoration: none;
                border-bottom: 2px solid transparent;
            }

            a:hover {
                border-bottom: 2px solid #8caaee;
            }

            td {
                border: 1px solid #8caaee;
                padding: 1rem;
            }

            tr:nth-child(even) {
                background-color: #2e3040;
            }

            button {
                background-color: #8caaee;
                color: #303446;
                border: none;
                padding: 0.6rem 1.2rem;
                border-radius: 4px;
                cursor: pointer;
            }

            button:hover {
                background-color: #babbf1;
            }
            details > summary {
                cursor: pointer;
                list-style-type: none;
            }

            details > summary::-webkit-details-marker {
                display: none;
            }

            details > summary::before {
                content: '📘';
            }

            details[open] > summary::before {
                content: '📖';
            }

            code {
                color: #f2d5cf;
                background-color: #1e2030;
                padding: 1rem;
                display: block;
                margin: 1rem 0;
                border-radius: 4px;
                overflow-x: scroll;
            }
            .inline-code {
                color: #f2d5cf;
                background-color: #1e2030;
                font-family: monospace;
            }
            #sending-container {
                border: 3px solid #8caaee;
                padding: 1rem;
                margin-bottom: 2rem;
            }

            #logo {
                width: 150px;
                max-width: 20vw;
                margin: 0 auto;
                display: block;
                transform: rotate(-2deg) scale(1);
                opacity: 0.8;
                transition:
                    transform 0.3s ease,
                    opacity 0.3s ease;
            }

            #logo:hover {
                transform: rotate(5deg) scale(1.1);
                opacity: 1;
            }
        </style>
    </head>
    <body>
        <main>
            <h1>My First Http</h1>
            <img id="logo" src="/image.svg" />
            <p>
                This website is served by Node. But,
                <strong>it isn't using the http package</strong>. Instead, it's
                reading the tcp stream, parsing it, and sending back the headers
                and body itself.
            </p>
            <p>
                The text you are reading right now was sent over this way. It's
                not a good http server, but it is an http server.
            </p>

            <div id="sending-container">
                <p>
                    Clicking this button will send an HTTP POST request to the
                    /echo endpoint. The request body length and body will be
                    returned by the kind server, and we'll show you the results.
                </p>
                <button id="send-button" type="button">
                    Post to <span style="font-family: monospace">/echo</span>
                </button>

                <h2>Results</h2>
                <table>
                    <tr>
                        <th>Request Body Length</th>
                        <th>Request Body</th>
                    </tr>
                </table>

                <p id="no-results">No results yet...</p>
            </div>

            <details>
                <summary>
                    See the code that serves this site:
                    <span class="inline-code">my-first-http.js</span>
                </summary>
                <pre><code>${escapedContents}</code></pre>
            </details>
        </main>
    </body>
    <script>
        let noResults = document.getElementById('no-results')
        let button = document.getElementById('send-button')
        button.addEventListener('click', async function () {
            noResults?.remove()
            let messages = [
                'hello',
                'this is you -> 🤡',
                '이건 영어가 아니에요.',
            ]

            let message = messages[Math.floor(Math.random() * messages.length)]

            try {
                let response = await fetch('/echo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                })
                let responseData = await response.json()
                let newRow = document.createElement('tr')
                let cell1 = document.createElement('td')
                let cell2 = document.createElement('td')
                newRow.appendChild(cell1)
                newRow.appendChild(cell2)
                cell1.textContent = JSON.stringify(
                    responseData.requestBodyLength,
                )
                cell2.textContent = JSON.stringify(responseData.requestBody)
                document.querySelector('table').appendChild(newRow)
            } catch (error) {
                console.info("Clunky ol' server's broke.")
                console.error(error)
            }
        })
    </script>
</html>
`,
                ].join("\r\n")

                socket.write(MY_HOME_PAGE)
                socket.end()
                break
            }

            /**
             * Favicon 🖼️
             */
            if (path === "/favicon.ico" || path === "/image.svg") {
                const MY_LOGO_IMAGE = [
                    "HTTP/1.0 200 OK",
                    "Content-Type: image/svg+xml",
                    "",
                    `
<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
 <g>
  <title>Layer 1</title>
  <line stroke-linecap="undefined" stroke-linejoin="undefined" id="svg_1" y2="182.31236" x2="10.625" y1="120.31238" x1="10.125" stroke="#000" fill="none"/>
  <rect stroke="#0F0" stroke-width="3" fill="#fff" x="2.75" y="12.81249" width="33.18747" height="2.1875" id="svg_6"/>
  <rect stroke="#0F0" stroke-width="3" fill="#fff" x="2.625" y="3.5" width="19.1875" height="2.1875" id="svg_7"/>
  <rect stroke="#0F0" stroke-width="3" fill="#fff" x="2.9375" y="35.74995" width="33.18747" height="2.1875" id="svg_8"/>
  <rect transform="rotate(90 34.7812 20.25)" stroke="#0F0" stroke-width="3" fill="#fff" x="18.21873" y="19.15623" width="33.12497" height="2.1875" id="svg_9"/>
  <rect transform="rotate(90 3.71872 12.9375)" stroke="#0F0" stroke-width="3" fill="#fff" x="-5.53128" y="11.84372" width="18.5" height="2.1875" id="svg_10"/>
  <rect stroke="#0F0" stroke-width="3" fill="#fff" x="2.6875" y="20.12498" width="19.1875" height="2.1875" id="svg_11"/>
  <rect stroke="#0F0" stroke-width="3" fill="#fff" x="2.5625" y="26.74996" width="33.18747" height="2.1875" id="svg_12"/>
  <rect transform="rotate(90 3.96874 31.75)" stroke="#0F0" stroke-width="3" fill="#fff" x="-0.53126" y="30.65622" width="9.00001" height="2.1875" id="svg_13"/>
 </g>
</svg>
`,
                ].join("\r\n")

                socket.write(MY_LOGO_IMAGE)
                socket.end()
                break
            }
        }

        // If we've arrived here, the request must not be a GET request because
        // we only allow the above paths for GET.
        // Let's make sure we have the whole body.
        let requestBodyLength = requestHeaders["Content-Length"]

        // If there is no content length, our little http server cannot
        // figure out of the whole body as been sent. So, we bail out.
        if (!requestBodyLength) {
            socket.write(
                "HTTP/1.1 400 Bad Request\r\n\r\nMissing Content-Length"
            )

            socket.end()
            break
        }

        requestBodyLength = Number(requestBodyLength)

        // 4 is the length of /r/n/r/n
        let expectedBytes = requestHeadersLength + 4 + requestBodyLength

        if (socket.bytesRead < expectedBytes) {
            continue
        }

        if (socket.bytesRead > expectedBytes) {
            socket.write(
                "HTTP/1.0 400 Bad Request\r\n\r\nYou sent me too many bytes"
            )
            socket.end()
        }

        // We only have one non GET endpoint.
        // We call it echo because it echos back the request data
        if (method === "POST" && path === "/echo") {
            let [, bodyData] = requestData.split("\r\n\r\n")
            let responseBody = {
                requestBodyLength,
                requestBody: JSON.parse(bodyData),
            }
            let responseString = JSON.stringify(responseBody)

            let contentLength = Buffer.byteLength(responseString)

            let response = [
                "HTTP/1.0 200 OK",
                "Content-Type: application/json",
                `Content-Length: ${contentLength}`,
                "",
                responseString,
            ].join("\r\n")

            socket.write(response)
            socket.end()
            break
        }

        socket.write("HTTP/1.0 404 Not found\r\n\r\n")
        socket.end()
    }
})

myTcpServer.listen(49001, () => {
    console.log(`\n  TCP Server is listening patiently on port 49001.\n`)
})
