import { samplingTelemetryProcessor } from 'applicationinsights/out/TelemetryProcessors'
import Context = require('applicationinsights/out/Library/Context')
import { Envelope } from 'applicationinsights/out/Declarations/Contracts'

export interface RulesDictonary {
  // example: '/api/v3/calculation': 50
  [key: string]: number
}

const samplingRulesByUrl = (aiClient: any, envelope: Envelope, context: any, rulesDictionary: RulesDictonary = {}) => {
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

export const addSamplingRulesByUrl = (rulesDictionary: RulesDictonary, aiClient: any) => {
  aiClient.addTelemetryProcessor((envelope: Envelope, context: Context) => samplingRulesByUrl(aiClient, envelope, context, rulesDictionary))
}