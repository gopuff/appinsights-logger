require('dotenv').config()
const { trackDebugEvent, trackEvent, aiClient, trackTrace } = require('../dist/index')

for (let index = 0; index < 10; index++) {
    trackTrace({ message: 'LOGGERTEST', properties: { index } })
    trackEvent({ name: 'LOGGERTEST', properties: { index } })
    trackDebugEvent({ name: 'LOGGERTEST:DEBUG', properties: { index } })    
}

aiClient.flush()