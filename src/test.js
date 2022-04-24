'use strict'

const WebSocket = require('ws')
const debug = require( 'debug')
const log = debug('oracle:client')

class Client {
    constructor() {
        let socket = new WebSocket('ws://127.0.0.1:6666')
        Object.assign(this, {
            connectWebsocket() {
                log('Connect Websocket')
                const  self = this
                socket.on('open', function (message) {
                    socket.send(JSON.stringify({
                        request: 'SUBSCRIBE',
                        message: '',
                        channel: 'USDCLP'
                    }))

                    socket.send(JSON.stringify({
                        request: 'SUBSCRIBE',
                        message: '',
                        channel: 'USDEUR'
                    }))

                    socket.send(JSON.stringify({
                        request: 'SUBSCRIBE',
                        message: '',
                        channel: 'EURZAR'
                    }))
                    log('trade sockets connected :)')
                })
                socket.on('message', function (data, isBinary) {
                    const message = isBinary ? data : data.toString()
                    log('new message', message)
                    const json = JSON.parse(message)
                    log('json', json)
                })
                socket.on('close', function (data, isBinary) {
                    const message = isBinary ? data : data.toString()
                    log('close message', message)
                })
                socket.on('error', function (data, isBinary) {
                    const message = isBinary ? data : data.toString()
                    log('error message', message)
                })
            }
        })
    }
}


const client = new Client()
client.connectWebsocket()