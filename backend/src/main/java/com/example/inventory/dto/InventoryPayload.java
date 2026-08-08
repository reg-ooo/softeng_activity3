package com.example.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface InventoryPayload {
    String getName();
    String getDescription();
    Integer getQuantity();
    BigDecimal getPrice();
    String getImagePath();

    default String getCategory() {
        return null;
    }

    default LocalDate getExpectedDeliveryDate() {
        return null;
    }
}
