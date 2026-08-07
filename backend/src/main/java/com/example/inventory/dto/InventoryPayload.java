package com.example.inventory.dto;

import java.math.BigDecimal;

public interface InventoryPayload {
    String getName();
    String getDescription();
    Integer getQuantity();
    BigDecimal getPrice();
    String getImagePath();
}
