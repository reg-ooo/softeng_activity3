package com.example.inventory.dto;

import java.math.BigDecimal;

public class CreateInventoryDTO {

    private String name;
    private String description;
    private Integer quantity;
    private BigDecimal price;
    private String imagePath;

    public CreateInventoryDTO() {
    }

    public CreateInventoryDTO(
            String name,
            String description,
            Integer quantity,
            BigDecimal price,
            String imagePath
    ) {
        this.name = name;
        this.description = description;
        this.quantity = quantity;
        this.price = price;
        this.imagePath = imagePath;
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
}
