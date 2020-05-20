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


## Advanced usage

### HTTP request tracking:

```ts
import { markDependency, measureDependency } from 'appinsights-logger'

const marker = markDependency('HTTP', 'GET /products')
try {
  const url = 'https://domain.com/api/products'
  const locations = await requestPromise(url)
  measureDependency(marker, url)
} catch(ex) {
  measureDependency(marker, url, false)
  // could also trackException(ex) here
}
```

### Cosmos query tracking:
> dependency tracking is useful for measuring latency of remote calls (SQL, HTTP) and also failures

```ts
import { markDependency, measureDependency } from 'appinsights-logger'

const marker = markDependency('cosmos', 'query collection')
try {
  const sql = 'select top 100 from c'
  const locations = await cosmosDb.items.query(sql) // pseudo-code cosmos query
  measureDependency(marker, sql)
} catch(ex) {
  measureDependency(marker, sql, false)
  // could also trackException(ex) here
}
```


### Debug Event tracking
> customEvents are powerful because you can query the logs by the `customDimensions` object

```ts
import { trackDebugEvent } from from 'appinsights-logger'

// This 'debug' event will only log if the DEBUG_INSIGHTS="true" env var is set
trackDebugEvent({ name: 'new order',  properties: { order }, measurements: { productCount: order.products.length } }) 
```



#### Run E2E Test

```sh
cp .env.example .env
```
> fill in `.env` with App Insight key

```sh
npm test
```

