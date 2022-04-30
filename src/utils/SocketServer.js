'use strict'

const EventEmitter = require('events')
const WebSocketServer = require('ws').Server
const debug = require( 'debug')
const log = debug('oracle:socketserver')

module.exports = class SocketServer extends EventEmitter {
    constructor() {
        super()
        this.rate = null
        Object.assign(this, {
            start(server, pubsub) {
                log('Starting socketserver')
                const wss = new WebSocketServer({ server: server })
                wss.getUniqueID = function () {
                    function s4() {
                        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
                    }
                    return s4() + s4() + '-' + s4()
                }
                wss.on('connection', (ws, req) => {
                    ws.id = wss.getUniqueID()
                    ws.on('message', (data) => {
                        try {
                            if (pubsub == null) { return }
                            const json = JSON.parse(data, true)
                            switch (json.request) {
                                case 'PUBLISH':
                                    pubsub.publish(ws, json.channel, json.message)
                                    break
                                case 'SUBSCRIBE':
                                    log('SUBSCRIBE: ' + json.message)
                                    pubsub.subscribe(ws, json.channel)
                                    if (json.channel in rate) {
                                        pubsub.publish(ws, json.channel, {
                                            rate: rate[json.channel].rate,
                                            time: rate[json.channel].time 
                                        })
                                    }
                                    break
                            }
                        } catch (error) {
                            log(error)
                        }
                    })
                    ws.on('close', () => {
                        log('Stopping client connection, ' + ws.id)
                        pubsub.unsubscribe(ws)
                        ws.terminate()
                    })
                    ws.on('error', (error) => {
                        log('SocketServer error')
                        log(error)
                    })
                })                
            },
            setRate(rate) {
                this.rate = rate
            }
        })
    }
}