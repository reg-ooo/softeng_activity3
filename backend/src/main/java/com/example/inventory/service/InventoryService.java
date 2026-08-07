package com.example.inventory.service;

import com.example.inventory.dto.CreateInventoryDTO;
import com.example.inventory.model.Inventory;
import main.java.com.example.inventory.dto.UpdateInventoryDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface InventoryService {
    Inventory create(CreateInventoryDTO data, MultipartFile image);
    List<Inventory> findAll();
    Inventory update(Long id, UpdateInventoryDTO data, MultipartFile image);
    Inventory softDelete(Long id);
}
