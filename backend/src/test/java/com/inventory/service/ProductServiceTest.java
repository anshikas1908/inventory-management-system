package com.inventory.service;

import com.inventory.entity.Category;
import com.inventory.entity.Product;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Category testCategory;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Electronics");

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setSku("SKU-001");
        testProduct.setName("Test Product");
        testProduct.setUnit("pcs");
        testProduct.setMinStockThreshold(10);
        testProduct.setCurrentQuantity(50);
        testProduct.setIsActive(true);
        testProduct.setCategory(testCategory);
    }

    @Test
    void createProduct_success() {
        when(productRepository.existsBySku("SKU-001")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        Product result = productService.createProduct(testProduct, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getSku()).isEqualTo("SKU-001");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void createProduct_duplicateSku_throwsException() {
        when(productRepository.existsBySku("SKU-001")).thenReturn(true);

        assertThatThrownBy(() -> productService.createProduct(testProduct, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SKU already exists");

        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_categoryNotFound_throwsException() {
        when(productRepository.existsBySku("SKU-001")).thenReturn(false);
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.createProduct(testProduct, 999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Category not found");
    }

    @Test
    void getLowStockProducts_returnsOnlyLowStockOnes() {
        Product lowStock = new Product();
        lowStock.setId(2L);
        lowStock.setCurrentQuantity(3);
        lowStock.setMinStockThreshold(10);
        lowStock.setIsActive(true);

        Product okStock = new Product();
        okStock.setId(3L);
        okStock.setCurrentQuantity(50);
        okStock.setMinStockThreshold(10);
        okStock.setIsActive(true);

        when(productRepository.findByIsActiveTrue()).thenReturn(List.of(lowStock, okStock));

        List<Product> result = productService.getLowStockProducts();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(2L);
    }

    @Test
    void getProductByBarcode_found() {
        testProduct.setBarcode("1234567890");
        when(productRepository.findByBarcode("1234567890")).thenReturn(Optional.of(testProduct));

        Product result = productService.getProductByBarcode("1234567890");

        assertThat(result.getBarcode()).isEqualTo("1234567890");
    }

    @Test
    void getProductByBarcode_notFound_throwsException() {
        when(productRepository.findByBarcode("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductByBarcode("UNKNOWN"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("barcode");
    }

    @Test
    void deactivateProduct_setsIsActiveFalse() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        productService.deactivateProduct(1L);

        verify(productRepository).save(argThat(p -> !p.getIsActive()));
    }

    @Test
    void getAllActiveProducts_delegatesToRepository() {
        when(productRepository.findByIsActiveTrue()).thenReturn(List.of(testProduct));

        List<Product> result = productService.getAllActiveProducts();

        assertThat(result).hasSize(1);
    }
}
