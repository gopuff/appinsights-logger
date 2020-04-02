## AppInsights logger
> wrapper for AI setup, compatible with Azure Functions

### Install
```sh
npm i appinsights-logger --save
```

### Environment setup
Just set ENV variable `APPINSIGHTS_INSTRUMENTATIONKEY`

### Usage:
```js
const { trackEvent, trackException } = require('appinsights-logger')

trackEvent({ name: 'TEST', properties: { myProp: 'my value' } })

const ex = new Error('some error')
trackException({ exception: ex, properties: { myProp: 'my value' } })
```


#### Run E2E Test

```sh
cp .env.example .env
```
> fill in `.env` with App Insight key

```sh
npm test
```

