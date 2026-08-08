package com.example.inventory.repository;

import com.example.inventory.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findAllByIsDeletedFalse();

    @Query(value = """
            SELECT *
            FROM inventory
            WHERE is_deleted = false
              AND (name ILIKE '%' || :query || '%'
                   OR description ILIKE '%' || :query || '%')
            """, nativeQuery = true)
    List<Inventory> searchActiveInventory(@Param("query") String query);

    Optional<Inventory> findByIdAndIsDeletedFalse(Long id);
}
