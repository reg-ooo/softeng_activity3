package com.example.inventory.service;

import com.example.inventory.dto.CreateInventoryDTO;
import com.example.inventory.dto.UpdateInventoryDTO;
import com.example.inventory.model.Inventory;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface InventoryService {
    Inventory create(CreateInventoryDTO data, MultipartFile image);
    List<Inventory> findAll();
    List<Inventory> search(String query);
    Inventory update(Long id, UpdateInventoryDTO data, MultipartFile image);
    Inventory softDelete(Long id);
}
