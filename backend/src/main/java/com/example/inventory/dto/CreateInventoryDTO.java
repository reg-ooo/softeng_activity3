package com.example.inventory.dto;

import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateInventoryDTO implements InventoryPayload {

    private String name;
    private String description;
    private Integer quantity;
    private BigDecimal price;
    private String imagePath;
    private String category;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate expectedDeliveryDate;

    public CreateInventoryDTO() {
    }

    public CreateInventoryDTO(
            String name,
            String description,
            Integer quantity,
            BigDecimal price,
            String imagePath
    ) {
        this(name, description, quantity, price, imagePath, null, null);
    }

    public CreateInventoryDTO(
            String name,
            String description,
            Integer quantity,
            BigDecimal price,
            String imagePath,
            String category,
            LocalDate expectedDeliveryDate
    ) {
        this.name = name;
        this.description = description;
        this.quantity = quantity;
        this.price = price;
        this.imagePath = imagePath;
        this.category = category;
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    @Override
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    @Override
    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }
}
