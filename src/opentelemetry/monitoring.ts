/**
const { MeterProvider } = require('@opentelemetry/metrics')
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus')
const api = require('@opentelemetry/api')

// TODO: use env to configure
const prometheusPort = PrometheusExporter.DEFAULT_OPTIONS.port
const prometheusEndpoint = PrometheusExporter.DEFAULT_OPTIONS.endpoint

const logger = require('logger').getScopedLogger(module)

const exporter = new PrometheusExporter(
  {
    startServer: true
  },
  () => {
    logger.info(
      { prometheusEndpoint, prometheusPort },
      `prometheus scrape endpoint: http://localhost:${prometheusPort}${prometheusEndpoint}`
    )
  },
  logger
)

const meterProvider = new MeterProvider({
  exporter,
  interval: 1000
})

const meter = meterProvider.getMeter('appinsights-logger')

api.metrics.setGlobalMeterProvider(meterProvider)

module.exports = {
  meterProvider,
  meter,
  exporter
}

*/