"""
Alipur Food - SQLAlchemy 2.0 Database Models
Normalized PostgreSQL Schema with strict foreign keys and auditable ledger
"""

import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SAEnum,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserRoleEnum(str, enum.Enum):
    CUSTOMER = "customer"
    RESTAURANT_ADMIN = "restaurant_admin"
    RIDER = "rider"
    SUPER_ADMIN = "super_admin"


class OrderStatusEnum(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"
    PLACED = "placed"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    RIDER_ASSIGNED = "rider_assigned"
    PICKED_UP = "picked_up"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    REFUND_PENDING = "refund_pending"
    REFUNDED = "refunded"


class PaymentMethodEnum(str, enum.Enum):
    COD = "cod"
    JAZZCASH = "jazzcash"
    EASYPAISA = "easypaisa"
    BANK_TRANSFER = "bank_transfer"


class RiderTypeEnum(str, enum.Enum):
    RESTAURANT_RIDER = "restaurant_rider"
    PLATFORM_RIDER = "platform_rider"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(128))
    role: Mapped[UserRoleEnum] = mapped_column(SAEnum(UserRoleEnum), default=UserRoleEnum.CUSTOMER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), index=True)
    owner_name: Mapped[str] = mapped_column(String(128))
    phone: Mapped[str] = mapped_column(String(20))
    address: Mapped[str] = mapped_column(String(255))
    area: Mapped[str] = mapped_column(String(128))
    latitude: Mapped[float] = mapped_column(Numeric(10, 6))
    longitude: Mapped[float] = mapped_column(Numeric(10, 6))
    status: Mapped[str] = mapped_column(String(32), default="pending_verification")
    onboarding_fee_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_payment_ref: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    onboarding_fee_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=1000.0)
    rider_model_default: Mapped[RiderTypeEnum] = mapped_column(
        SAEnum(RiderTypeEnum), default=RiderTypeEnum.PLATFORM_RIDER
    )
    is_open: Mapped[bool] = mapped_column(Boolean, default=True)
    bank_account_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    menu_categories: Mapped[List["MenuCategory"]] = relationship("MenuCategory", back_populates="restaurant")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="restaurant")


class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="menu_categories")
    items: Mapped[List["MenuItem"]] = relationship("MenuItem", back_populates="category")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("menu_categories.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    image_url: Mapped[str] = mapped_column(String(512))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    category: Mapped["MenuCategory"] = relationship("MenuCategory", back_populates="items")


class Rider(Base):
    __tablename__ = "riders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(128))
    phone: Mapped[str] = mapped_column(String(20))
    vehicle_type: Mapped[str] = mapped_column(String(64))
    license_plate: Mapped[str] = mapped_column(String(32))
    rider_type: Mapped[RiderTypeEnum] = mapped_column(SAEnum(RiderTypeEnum))
    restaurant_id: Mapped[Optional[str]] = mapped_column(ForeignKey("restaurants.id"), nullable=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    cash_in_hand: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    current_lat: Mapped[Optional[float]] = mapped_column(Numeric(10, 6), nullable=True)
    current_lng: Mapped[Optional[float]] = mapped_column(Numeric(10, 6), nullable=True)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    order_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    rider_id: Mapped[Optional[str]] = mapped_column(ForeignKey("riders.id"), nullable=True, index=True)

    delivery_address: Mapped[str] = mapped_column(String(255))
    delivery_area: Mapped[str] = mapped_column(String(128))

    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_charge: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    delivery_expense: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    delivery_funding: Mapped[str] = mapped_column(String(32), default="platform_funded")
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    final_total: Mapped[float] = mapped_column(Numeric(10, 2))

    payment_method: Mapped[PaymentMethodEnum] = mapped_column(SAEnum(PaymentMethodEnum))
    payment_status: Mapped[str] = mapped_column(String(32), default="pending")
    payment_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    status: Mapped[OrderStatusEnum] = mapped_column(
        SAEnum(OrderStatusEnum), default=OrderStatusEnum.PLACED, index=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    platform_fee_charged: Mapped[bool] = mapped_column(Boolean, default=False)
    platform_fee_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=10.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    menu_item_id: Mapped[str] = mapped_column(ForeignKey("menu_items.id"))
    name: Mapped[str] = mapped_column(String(128))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    total_price: Mapped[float] = mapped_column(Numeric(10, 2))

    order: Mapped["Order"] = relationship("Order", back_populates="items")


class FinancialLedgerEntry(Base):
    """
    Immutable Auditable Financial Ledger Entry
    Double-Entry Bookkeeping compliant.
    """
    __tablename__ = "financial_ledger_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    entry_type: Mapped[str] = mapped_column(String(64), index=True)
    debit_account: Mapped[str] = mapped_column(String(64), index=True)
    credit_account: Mapped[str] = mapped_column(String(64), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="PKR")

    restaurant_id: Mapped[Optional[str]] = mapped_column(ForeignKey("restaurants.id"), nullable=True, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)
    rider_id: Mapped[Optional[str]] = mapped_column(ForeignKey("riders.id"), nullable=True, index=True)

    reference_number: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    recorded_by: Mapped[str] = mapped_column(String(64))
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128), unique=True, nullable=True)

    __table_args__ = (
        Index("idx_ledger_rest_order", "restaurant_id", "order_id"),
    )
