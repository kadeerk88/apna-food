"""
Pydantic Schemas for FastAPI API Validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class RestaurantCreate(BaseModel):
    name: str = Field(..., example="Al-Madina Shinwari & Karahi")
    owner_name: str = Field(..., example="Haji Ghulam Rasool")
    phone: str = Field(..., example="+923007821940")
    address: str = Field(..., example="Near Kutchery Chowk, Alipur")
    area: str = Field(..., example="Kutchery Chowk, Alipur")
    latitude: float = Field(..., example=29.3845)
    longitude: float = Field(..., example=70.9123)
    cuisines: List[str] = Field(default_factory=list)


class MenuItemCreate(BaseModel):
    restaurant_id: str
    category_id: str
    name: str
    description: str
    price: float = Field(..., gt=0)
    image_url: str


class OrderItemRequest(BaseModel):
    menu_item_id: str
    name: str
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


class OrderCreateRequest(BaseModel):
    restaurant_id: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    delivery_area: str
    items: List[OrderItemRequest]
    payment_method: str = Field(..., pattern="^(cod|jazzcash|easypaisa|bank_transfer)$")
    customer_note: Optional[str] = None
    coupon_code: Optional[str] = None
    idempotency_key: Optional[str] = None


class OrderStatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None
    rejection_reason: Optional[str] = None
    rider_id: Optional[str] = None


class OnboardingVerificationRequest(BaseModel):
    payment_method: str = Field(..., pattern="^(bank_transfer|jazzcash|easypaisa)$")
    reference_number: str
    amount_paid: float = 1000.0


class SettlementApprovalRequest(BaseModel):
    settlement_id: str
    bank_payment_reference: str
    notes: Optional[str] = None
