const EventEmitter = require('events')
const WebSocketServer = require('ws').Server
const TransferWise = require('./utils/TransferWise.js')
const dotenv = require('dotenv')
const debug = require( 'debug')

const log = debug('oracle:main')
dotenv.config()

class Main extends EventEmitter {
    constructor() {
        super()
        
        const wss = new WebSocketServer({ port: process.env.PORT })
        const transferWise = new TransferWise()

        const parameters = {
            interval: 4000
        }

        Object.assign(this, {
            pushRates() {
                const self = this
                transferWise.addListener('fx-data', function(data) {
                    log('fx-data', data.length)
                    const filtered = []
                    for (let index = 0; index < data.length; index++) {
                        const element = data[index]
                        if (element.source === 'USD') {
                            if (element.target === 'CLP') {
                                log('CLP', element.rate)
                            }
                            filtered.push(element)
                            self.route(element.source + element.target, {
                                rate: element.rate,
                                time: element.time 
                            })
                        }
                    }
                    self.route('rates', filtered)
                })
            },
            stop() {
                transferWise.stop()
                clearInterval(this.instance)
            },
            start() {
                transferWise.run()
                this.instance = setInterval(function() {
                    transferWise.emit('fx-fetch')
                }, parameters.interval)
                this.pushRates()
            },
            route(channel, message) {
				const string = '{"' + channel +'": ' + JSON.stringify(message) + '}'
				wss.clients.forEach(function each(client) {
					client.send(string)
				})
			},
            run() {
                this.start()
            }
        })
    }
}

const oracle = new Main()
oracle.run()