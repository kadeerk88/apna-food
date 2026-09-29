import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Layers,
  Database,
  Terminal,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface BackendDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendDocsModal: React.FC<BackendDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'fastapi' | 'models' | 'docker' | 'ledger'>(
    'fastapi'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets = {
    fastapi: `# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, restaurants, orders, riders, ledger, settlements

app = FastAPI(
    title="Alipur Food Platform API",
    description="Multi-restaurant food delivery marketplace backend for Alipur, Punjab, Pakistan",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Versioned API Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(restaurants.router, prefix="/api/v1/restaurants", tags=["Restaurants"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders & Cart"])
app.include_router(riders.router, prefix="/api/v1/riders", tags=["Riders & Dispatch"])
app.include_router(ledger.router, prefix="/api/v1/ledger", tags=["Financial Ledger"])
app.include_router(settlements.router, prefix="/api/v1/settlements", tags=["Settlements"])

# Real-time WebSocket for Rider & Order Tracking
@app.websocket("/ws/orders/{order_id}")
async def ws_order_tracking(websocket: WebSocket, order_id: str):
    await websocket.accept()
    # Broadcast live GPS lat/lng and state transitions
`,
    models: `# backend/models.py - SQLAlchemy 2.0 Database Models
class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    order_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    rider_id: Mapped[Optional[str]] = mapped_column(ForeignKey("riders.id"), nullable=True)

    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_charge: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_expense: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_funding: Mapped[str] = mapped_column(String(32), default="platform_funded")
    final_total: Mapped[float] = mapped_column(Numeric(10, 2))

    status: Mapped[OrderStatusEnum] = mapped_column(SAEnum(OrderStatusEnum), index=True)
    platform_fee_charged: Mapped[bool] = mapped_column(Boolean, default=False)
    platform_fee_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=10.0)

class FinancialLedgerEntry(Base):
    __tablename__ = "financial_ledger_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    entry_type: Mapped[str] = mapped_column(String(64), index=True)
    debit_account: Mapped[str] = mapped_column(String(64))
    credit_account: Mapped[str] = mapped_column(String(64))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    reference_number: Mapped[str] = mapped_column(String(128))
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128), unique=True)
`,
    docker: `# docker-compose.yml
version: '3.9'
services:
  api:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=postgresql://alipur_admin:SecurePass2026@postgres:5432/alipur_food_db
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=alipur_food_db
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
`,
    ledger: `# Financial Ledger Invariant & Calculation Service
# Reconciles:
# - Restaurant Onboarding: PKR 1,000 one-time
# - Completed Order Fee: PKR 10 charged only on 'delivered' status
# - Cash on Delivery Segregation:
#     Model A (Restaurant Rider) -> RESTAURANT_OWN_CASH_REGISTER
#     Model B (Platform Rider)   -> PLATFORM_RIDER_CASH_HOLDINGS
# - Weekly Settlement formula:
#     Net Payable = (Digital + COD Platform Rider) - Platform Fees (PKR 10 * N)
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-stone-900">
                Python 3.12 + FastAPI & PostgreSQL Architecture
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Production backend code files for Alipur Food: SQLAlchemy 2.0 models, FastAPI routers, Docker Compose, and financial ledger engine.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => setActiveTab('fastapi')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'fastapi'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              FastAPI Core
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'models'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              SQLAlchemy Models
            </button>
            <button
              onClick={() => setActiveTab('docker')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'docker'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Docker Compose
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ledger Accounting Logic
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md border border-stone-200 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto py-3">
          <pre className="p-4 bg-stone-950 text-stone-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-stone-800">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Backend files exported to /backend/ and docker-compose.yml</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
