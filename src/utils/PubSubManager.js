'use strict'

const EventEmitter = require('events')
const debug = require( 'debug')
const log = debug('oracle:pubsub')

module.exports = class PubSubManager extends EventEmitter {
    constructor() {
        super()
        const self = this
        let channels = {}

        Object.assign(this, {
            addChannel(channel) {
                log(`Created channel ${channel}`)
                channels[channel] = {
                    message: [],
                    subscribers: []
                }
            },
            unsubscribe(subscriber) {
                log('unsubscribe client ' + subscriber.id)
                for (const [key, value] of Object.entries(channels)) {
                    for (let i = 0; i < value.subscribers.length; i++) {
                        const element = value.subscribers[i]
                        if (element.id == subscriber.id) {
                            log(`Client ${element.id} removed`)
                            value.subscribers.splice(i, 1)
                        }
                        if (value.subscribers.length == 0) {
                            delete channels[key]
                            log(`Channel ${key} removed`)
                        }
                    }
                }
            },
            subscribe(subscriber, channel) {
                if (!(channel in channels)) {
                    this.addChannel(channel)
                }
                channels[channel].subscribers.push(subscriber)
            },
            subscribers() {
                let count = 0
                for (const [key, value] of Object.entries(channels)) {
                    count += value.subscribers.length
                }
                return count
            },
            firstChannel() {
                let count = 0
                let source = null
                let target = null
                for (const [key, value] of Object.entries(channels)) {
                    count++
                    source = key.substring(0, 3)
                    target = key.substring(3, 6)
                }
                return {
                    count: count,
                    source: source,
                    target: target,
                }
            },
            publish(channel, message) {
                // only publish to channels with subscribers
                if (!(channel in channels)) { return } 
                channels[channel].message.push(message)
            },
            broker() {
                for (const channel in channels) {
                    if (channels.hasOwnProperty(channel)) {
                        const channelObj = channels[channel]
                        if (channels[channel].subscribers.length > 0) {
                            if (channelObj.message) {
                                channelObj.subscribers.forEach(subscriber => {
                                    for (var i = 0; i < channelObj.message.length; i++) {
                                        const string =  JSON.stringify(channelObj.message[i])
                                        subscriber.send('{"' + channel +'": ' + string + '}')
                                        // log('{"' + channel +'": ' + string + '}')
                                    }
                                })
                
                                channelObj.message = []
                            }   
                        }
                    }
                }
            },
            route(channel, message) {
                this.publish(channel, message)
            },
            setup() {
                // Listen for our event and dispatch its process
                this.addListener('broker', function() {
                    this.broker()
                })
            },
            start() {
                this.setup()
                setInterval(() => {
                    self.emit('broker', true)
                }, 100)
            }
        })
    }
}