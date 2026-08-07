package main.java.com.example.inventory.dto;

import java.math.BigDecimal;

import com.example.inventory.dto.InventoryPayload;

public class UpdateInventoryDTO implements InventoryPayload {
    private String name;
    private String description;
    private Integer quantity;
    private BigDecimal price;
    private String imagePath;
    private boolean deletedImage;

    public UpdateInventoryDTO() {
    }

    public UpdateInventoryDTO(
            String name,
            String description,
            Integer quantity,
            BigDecimal price,
            String imagePath,
            boolean deletedImage
    ) {
        this.name = name;
        this.description = description;
        this.quantity = quantity;
        this.price = price;
        this.imagePath = imagePath;
        this.deletedImage = deletedImage;
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

    public boolean isDeletedImage() {
        return deletedImage;
    }

    public void setDeletedImage(boolean deletedImage) {
        this.deletedImage = deletedImage;
    }
}
