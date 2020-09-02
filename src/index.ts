import * as appInsights from 'applicationinsights'
import { EventTelemetry, DependencyTelemetry, ExceptionTelemetry, MetricTelemetry, RequestTelemetry, TraceTelemetry } from 'applicationinsights/out/Declarations/Contracts'
const clientKey = (process.env.APPINSIGHTS_INSTRUMENTATIONKEY || "fake")

appInsights.setup(clientKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(<boolean>(process.env.AI_AUTOCOLLECT_DEPENDENCIES ? process.env.AI_AUTOCOLLECT_DEPENDENCIES : true))
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(false)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();

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

interface IMarker {
  dependencyTypeName: string;
  name: string;
  startTime: number;
}

export function markDependency (dependencyTypeName: string, name: string): IMarker {
  const startTime = Date.now()
  return { dependencyTypeName, name, startTime }
}

export function measureDependency (marker: IMarker, data = '', success = true): void {
  const { startTime, dependencyTypeName, name } = marker
  const duration = Date.now() - startTime
  const telemetry = { dependencyTypeName, name, duration, success, data } as DependencyTelemetry
  trackDependency(telemetry)
}
