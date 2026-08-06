package com.example.inventory.service;

import com.example.inventory.dto.CreateInventoryDTO;
import com.example.inventory.model.Inventory;
import org.springframework.web.multipart.MultipartFile;

public interface InventoryService {
    Inventory create(CreateInventoryDTO data, MultipartFile image);
}
