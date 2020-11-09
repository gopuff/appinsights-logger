const { APPINSIGHTS_INSTRUMENTATIONKEY } = process.env.APPINSIGHTS_INSTRUMENTATIONKEY

const { LogLevel } = require('@opentelemetry/core')
const { NodeTracerProvider } = require('@opentelemetry/node')
const { BatchSpanProcessor } = require('@opentelemetry/tracing')
const { meter, exporter } = require('./monitoring')

// Use your existing provider
const provider = new NodeTracerProvider({
  plugins: {
    koa: {
      enabled: true,
      path: '@opentelemetry/koa-instrumentation'
    },
    https: {
      // Ignore Application Insights Ingestion Server
      ignoreOutgoingUrls: [new RegExp(/dc.services.visualstudio.com/i)]
    }
  },
  logLevel: LogLevel.INFO
})

provider.register()

if (APPINSIGHTS_INSTRUMENTATIONKEY) {
  const { AzureMonitorTraceExporter } = require('@azure/monitor-opentelemetry-exporter')

  // Create an exporter instance
  const exporter = new AzureMonitorTraceExporter({
    logger: provider.logger,
    instrumentationKey: APPINSIGHTS_INSTRUMENTATIONKEY
  })

  // Add the exporter to the provider
  provider.addSpanProcessor(
    new BatchSpanProcessor(exporter, {
      bufferTimeout: 15000,
      bufferSize: 1000
    })
  )
}

const api = require('@opentelemetry/api')
const { HttpTraceContext } = require('@opentelemetry/core')

/* Set Global Propagator */
api.propagation.setGlobalPropagator(new HttpTraceContext())

module.exports = {
  tracer: provider.getTracer('go-drive'),
  meter,
  exporter
}