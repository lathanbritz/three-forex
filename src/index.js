const EventEmitter = require('events')
const app = require('express')()
const express = require('express')
const SocketServer = require('./utils/SocketServer.js')
const PubSubManager = require('./utils/PubSubManager.js')
const TransferWise = require('./utils/TransferWise.js')
const http = require('http')
const dotenv = require('dotenv')
const httpServer = http.createServer(app).listen(process.env.PORT)
const debug = require( 'debug')

const log = debug('oracle:main')
dotenv.config()

class Main extends EventEmitter {
    constructor() {
        super()
        
        const httpSocket = new SocketServer()
        const pubsub = new PubSubManager()
        const transferWise = new TransferWise()

        const parameters = {
            interval: 4000,
            port: process.env.PORT
        }

        Object.assign(this, {
            pushRates() {
                transferWise.addListener('fx-data', function(data) {
                    log('fx-data', data.length)
                    for (let index = 0; index < data.length; index++) {
                        const element = data[index]
                        // if (element.source == 'USD' && element.target == 'CLP') {
                        //     log('USD/CLP', element)
                        // }
                        pubsub.route(element.source + element.target, {
                            rate: element.rate,
                            time: element.time 
                        })
                    }
                })
            },
            stop() {
                transferWise.stop()
                clearInterval(this.instance)
            },
            start() {
                transferWise.run()
                this.instance = setInterval(function() {
                    if (pubsub.subscribers() > 0) {
                        transferWise.setSourceTarget(null, null)

                        const params = pubsub.firstChannel()
                        if (params.count == 1) {
                            // log('setting single channel')
                            transferWise.setSourceTarget(params.source, params.target)
                        }

                        log(`subscriber count ${pubsub.subscribers()}, channels ${params.count}`)
                        transferWise.emit('fx-fetch')    
                    }
                }, parameters.interval)

                httpSocket.start(httpServer, pubsub)
                pubsub.start()
                this.pushRates()
            },
            run() {
                this.start()
            }
        })
    }
}

const oracle = new Main()
oracle.run()