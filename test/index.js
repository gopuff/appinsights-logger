require('dotenv').config()
const { trackDebugEvent, trackEvent, aiClient, trackTrace, addSamplingRulesByUrl } = require('../dist/index')

for (let index = 0; index < 10; index++) {
    trackTrace({ message: 'LOGGERTEST', properties: { index } })
    trackEvent({ name: 'LOGGERTEST', properties: { index } })
    trackDebugEvent({ name: 'LOGGERTEST:DEBUG', properties: { index } })    
}
addSamplingRulesByUrl({'/home': '5'})
console.log('telemetry processors added to aiclient:')
aiClient._telemetryProcessors.map(p => console.log(p.toString()))
aiClient.flush()
