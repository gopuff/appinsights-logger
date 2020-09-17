import * as appInsights from 'applicationinsights'
import { EventTelemetry, DependencyTelemetry, ExceptionTelemetry, MetricTelemetry, RequestTelemetry, TraceTelemetry, Envelope } from 'applicationinsights/out/Declarations/Contracts'
import { samplingTelemetryProcessor } from 'applicationinsights/out/TelemetryProcessors'
import Context = require('applicationinsights/out/Library/Context')
const clientKey = (process.env.APPINSIGHTS_INSTRUMENTATIONKEY || "fake")

appInsights.setup(clientKey)
    .setAutoDependencyCorrelation(<boolean>(process.env.AI_AUTO_DEPENDENCY_CORRELATE === 'false' ? false : true))
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(<boolean>(process.env.AI_AUTOCOLLECT_DEPENDENCIES === 'false' ? false : true))
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(false)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    

export const ai = appInsights // in case you need to override setup()
export const aiClient = appInsights.defaultClient
aiClient.config.samplingPercentage = parseInt(process.env.AI_SAMPLING_PERCENTAGE || '100')
ai.start()

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

interface RulesDictonary {
  // example: '/api/v3/calculation': 50
  [key: string]: number
}

const samplingRulesByUrl = (envelope: Envelope, context: any, rulesDictionary: RulesDictonary = {}) => {
  // if it's not an http request, use the regular sampling processor
  if (!context['http.RequestOptions']) {
    return samplingTelemetryProcessor(envelope, { correlationContext: context })
  }
  // otherwise, use the rules dictionary to determine how much to sample
  const pathname = (context['http.RequestOptions'].uri || {}).pathname
  const samplingRate = rulesDictionary[pathname] || aiClient.config.samplingPercentage

  // if false returned from a telemetry processor, the data will not be sent
  return samplingRate >= (Math.random() * 100)
} 

export const addSamplingRulesByUrl = (rulesDictionary: RulesDictonary) => {
  aiClient.addTelemetryProcessor((envelope: Envelope, context: Context) => samplingRulesByUrl(envelope, context, rulesDictionary))
}
