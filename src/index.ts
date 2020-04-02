import * as appInsights from 'applicationinsights'
import { EventTelemetry, DependencyTelemetry, ExceptionTelemetry, MetricTelemetry, RequestTelemetry, TraceTelemetry } from 'applicationinsights/out/Declarations/Contracts'
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start()
export const aiClient = appInsights.defaultClient
export const ai = appInsights // in case you need to override setup()
const debugInsightsEnabled = (process.env.DEBUG_INSIGHTS === 'true') || false
aiClient.context.tags[aiClient.context.keys.cloudRole] = process.env.WEBSITE_SITE_NAME || 'defaultCloudRole'

export function trackEvent (telemetry: EventTelemetry): void { aiClient.trackEvent(telemetry) }
export function trackException (telemetry: ExceptionTelemetry): void { aiClient.trackException(telemetry) }
export function trackDependency (telemetry: DependencyTelemetry): void { aiClient.trackDependency(telemetry) }
export function trackTrace (telemetry: TraceTelemetry): void { aiClient.trackTrace(telemetry) }
export function trackRequest (telemetry: RequestTelemetry): void { aiClient.trackRequest(telemetry) }
export function trackMetric (telemetry: MetricTelemetry): void { aiClient.trackMetric(telemetry) }

export function trackDebugEvent (telemetry: EventTelemetry): void {
  if (debugInsightsEnabled) {
    trackEvent(telemetry)
  }
}

export function markDependency (dependencyTypeName: String, name: String): any {
  const startTime = Date.now()
  return { dependencyTypeName, name, startTime }
}

export function measureDependency ({ dependencyTypeName, name, startTime }): void {
  const duration = Date.now() - startTime
  const telemetry = { dependencyTypeName, name, duration, success: true } as DependencyTelemetry
  trackDependency(telemetry)
}