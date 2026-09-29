import React, { useState } from 'react';
import { runAllAutomatedTests, TestResult } from '../../services/testRunner';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  X,
  Clock,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await runAllAutomatedTests();
      setResults(res);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-stone-900">
                Automated Test Suite Runner
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Executes real unit and integration test assertions across cart isolation, order state machine, PKR 10 fees, COD segregation, and double-entry ledger invariants.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {results.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-stone-300" />
              <div className="text-sm font-medium text-stone-600">
                Automated test suite ready
              </div>
              <div className="text-xs text-stone-400 max-w-sm mx-auto">
                Click "Run All Tests" below to execute live verification against the active memory engine.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
                <span className="font-semibold text-stone-700">
                  Execution Report ({results.length} Scenarios):
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-emerald-700 font-bold">{passedCount} Passed</span>
                  {failedCount > 0 && (
                    <span className="text-rose-600 font-bold">{failedCount} Failed</span>
                  )}
                </div>
              </div>

              {results.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    r.status === 'passed'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {r.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-bold text-stone-900">{r.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-stone-400 font-mono text-[10px]">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-600">
                        {r.category}
                      </span>
                      <span>{r.durationMs}ms</span>
                    </div>
                  </div>

                  <div className="pl-6 text-[11px] text-stone-600">
                    {r.message}
                  </div>

                  {r.details && (
                    <div className="pl-6 text-[10px] text-rose-700 font-mono overflow-x-auto">
                      {r.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[11px] text-stone-500">
            Pytest / Vitest compatible assertion logic
          </div>
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isRunning ? 'Running Assertions...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
