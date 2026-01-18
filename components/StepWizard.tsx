'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'

export interface Step {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
}

interface StepWizardProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  completedSteps?: Set<number>
}

export default function StepWizard({
  steps,
  currentStep,
  onStepClick,
  completedSteps = new Set(),
}: StepWizardProps) {
  return (
    <div
      className="w-full"
      role="navigation"
      aria-label={`שלב ${currentStep + 1} מתוך ${steps.length}: ${steps[currentStep]?.title}`}
    >
      {/* Screen reader announcement for step changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        שלב {currentStep + 1} מתוך {steps.length}: {steps[currentStep]?.title}.{' '}
        {steps[currentStep]?.description}
      </div>

      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:block" role="group" aria-label="התקדמות בטופס">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = completedSteps.has(index)
            const isClickable = onStepClick && (isCompleted || index < currentStep)

            return (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  {/* Step circle */}
                  <button
                    onClick={() => isClickable && onStepClick(index)}
                    disabled={!isClickable}
                    aria-label={`${step.title}${isCompleted ? ' (הושלם)' : isActive ? ' (שלב נוכחי)' : ''}`}
                    aria-current={isActive ? 'step' : undefined}
                    className={`
                      relative w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isActive ? 'bg-blue-600 shadow-lg scale-110' : ''}
                      ${isCompleted ? 'bg-green-500' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-200' : ''}
                      ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <span
                        className={`
                        text-sm font-bold
                        ${isActive ? 'text-white' : 'text-gray-600'}
                      `}
                      >
                        {index + 1}
                      </span>
                    )}

                    {/* Active ring */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-blue-300"
                        initial={{ scale: 1, opacity: 0 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </button>

                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <div
                      className={`
                      text-sm font-medium
                      ${isActive ? 'text-blue-600' : ''}
                      ${isCompleted ? 'text-green-600' : ''}
                      ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                    `}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{step.description}</div>
                  </div>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mb-8 relative">
                    <div className="absolute inset-0 bg-gray-200" />
                    <motion.div
                      className={`absolute inset-0 ${isCompleted ? 'bg-green-500' : 'bg-blue-600'}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: completedSteps.has(index) ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: 'right' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Vertical compact stepper */}
      <div className="md:hidden">
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">
              שלב {currentStep + 1} מתוך {steps.length}
            </span>
            <span className="text-xs text-gray-400">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>

          {/* Slimmer progress bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Current step - more compact */}
          <div className="mt-2">
            <h3 className="text-sm font-semibold text-gray-900">{steps[currentStep].title}</h3>
            <p className="text-xs text-gray-500">{steps[currentStep].description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
