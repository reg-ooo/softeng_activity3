package com.example.inventory.controller;

import com.example.inventory.dto.CreateInventoryDTO;
import com.example.inventory.model.Inventory;
import com.example.inventory.service.InventoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Inventory> createInventory(
            @ModelAttribute CreateInventoryDTO data,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        if (data == null) {
            return ResponseEntity.status(400).build();
        }

        Inventory inventory = inventoryService.create(data, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(inventory);
    }
}
