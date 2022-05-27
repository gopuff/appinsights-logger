import * as appInsights from 'applicationinsights'
import { EventTelemetry, DependencyTelemetry, ExceptionTelemetry, MetricTelemetry, RequestTelemetry, TraceTelemetry, Telemetry } from 'applicationinsights/out/Declarations/Contracts'
import { addSamplingRulesByUrl, RulesDictonary } from './samplingRulesByUrl'
import { Agent } from 'https'
const clientKey = (process.env.APPINSIGHTS_INSTRUMENTATIONKEY || 'fake')
const messageNamespace = (process.env.AI_MESSAGE_NAMESPACE || 'missingnamespace')

appInsights.setup(clientKey)
  .setAutoDependencyCorrelation(<boolean>(process.env.AI_AUTO_DEPENDENCY_CORRELATE !== 'false'))
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(<boolean>(process.env.AI_AUTOCOLLECT_DEPENDENCIES !== 'false'))
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(process.env.AI_ENABLE_LIVEMETRICS === 'true') // Default to disabled: https://github.com/microsoft/ApplicationInsights-node.js/issues/615
  .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
const maxSockets = (process.env.AI_MAX_SOCKETS || 20) as number
const maxFreeSockets = (process.env.AI_MAX_FREE_SOCKETS || 10) as number
appInsights.defaultClient.config.httpsAgent = new Agent({ keepAlive: true, maxSockets, maxFreeSockets })

export const ai = appInsights // in case you need to override setup()
export const aiClient = appInsights.defaultClient
aiClient.config.samplingPercentage = parseInt(process.env.AI_SAMPLING_PERCENTAGE || '100')
ai.start()

const debugInsightsEnabled = (process.env.DEBUG_INSIGHTS === 'true') || false
aiClient.context.tags[aiClient.context.keys.cloudRole] = process.env.WEBSITE_SITE_NAME || 'defaultCloudRole'

export function trackEvent (telemetry: EventTelemetry): void { aiClient.trackEvent(addMetadataProps(telemetry)) }
export function trackException (telemetry: ExceptionTelemetry): void {
  aiClient.trackException(addMetadataProps(telemetry))
}
export function trackDependency (telemetry: DependencyTelemetry): void {
  aiClient.trackDependency(addMetadataProps(telemetry))
}
export function trackTrace (telemetry: TraceTelemetry): void { aiClient.trackTrace(addMetadataProps(telemetry)) }
export function trackRequest (telemetry: RequestTelemetry): void { aiClient.trackRequest(addMetadataProps(telemetry)) }
export function trackMetric (telemetry: MetricTelemetry): void { aiClient.trackMetric(addMetadataProps(telemetry)) }

export function trackDebugEvent (telemetry: EventTelemetry): void {
  if (debugInsightsEnabled) {
    trackEvent(addMetadataProps(telemetry))
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

export function samplingRulesByUrl (rulesDictionary: RulesDictonary) {
  addSamplingRulesByUrl(rulesDictionary, aiClient)
}

export function addMetadataProps<T extends Telemetry> (telemetry: T) {
  telemetry.properties = { ...telemetry.properties, namespace: messageNamespace }
  return telemetry
}

export function httpTriggerWrapper (fn, customDimensions = {}) {
  return async function contextPropagatingHttpTrigger (context, req) {
    const correlationContext = ai.startOperation(context, req)

    return ai.wrapWithCorrelationContext(async () => {
      const startTime = Date.now()
      await fn(context, req)
      const res = context.res || { status: 599 }
      ai.defaultClient.trackRequest({
        name: context.req.method + ' ' + context.req.url,
        resultCode: res.status,
        success: res.status < 400,
        url: req.url,
        duration: Date.now() - startTime,
        id: correlationContext.operation.parentId,
        properties: customDimensions
      })
    }, correlationContext)()
  }
}

/**
 * Wrap your handler with this function in order to get correlation logs
 *   for your function
 * Note: for adding correlation support to Http triggers @see httpTriggerWrapper
 *
 * @param fn Function to run
 * @param eventName name of the event that will be tracked in AI
 * @param customDimensions any custom metric dimension
 *
 * @see https://github.com/microsoft/ApplicationInsights-node.js/#setting-up-auto-correlation-for-azure-functions
 */
export function functionWrapper (fn, eventName = 'FUNCTION_EXECUTION', customDimensions = {}) {
  return async function contextPropagationTrigger (context) {
    const correlationContext = ai.startOperation(context, context.executionContext.functionName)
    return ai.wrapWithCorrelationContext(async () => {
      const startTime = Date.now()
      try {
        await fn(context)
        ai.defaultClient.trackRequest({
          name: context.executionContext.functionName,
          resultCode: 'complete',
          success: true,
          url: eventName,
          duration: Date.now() - startTime,
          id: correlationContext.operation.parentId,
          properties: customDimensions
        })
      } catch (err) {
        ai.defaultClient.trackRequest({
          name: context.executionContext.functionName,
          resultCode: 'failure',
          success: false,
          url: eventName,
          duration: Date.now() - startTime,
          id: correlationContext.operation.parentId,
          properties: {
            error: err,
            ...customDimensions
          }
        })
        throw err
      }
    }, correlationContext)()
  }
}
