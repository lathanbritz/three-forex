'use strict'

const EventEmitter = require('events')
const axios = require('axios')
const dotenv = require('dotenv')
const debug = require( 'debug')
const log = debug('oracle:transferwise')

dotenv.config()

module.exports = class TransferWise extends EventEmitter {
    constructor($store) {
        super()

        log('TransferWise constructor')

        Object.assign(this, {
            async run() {
                const self = this
                this.addListener('fx-fetch', async function() {
                    try {
                        const uri = 'https://api.transferwise.com/v1/rates' //(parameters.source == null || parameters.target== null) ? `https://api.transferwise.com/v1/rates` : `https://api.transferwise.com/v1/rates?source=${parameters.source}&target=${parameters.target}`
                        const {data} = await axios.get(uri, {
                        headers: {
                            Authorization: 'Bearer ' + process.env.TRANSFERWISE_APPSECRET
                        }})

                        if (data != null && data.length > 0) {
                            return self.emit('fx-data', data)
                        }
                    } catch (error) {
                        log('error', error)
                        // return false
                    }
                })
            },
            stop() {
                log('stoping fetching fxrate')
                this.removeAllListeners()
            }
        })
    }
}