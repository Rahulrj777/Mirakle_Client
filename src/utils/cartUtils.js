// This function ensures consistent variant ID generation across frontend and backend.
export function generateVariantId(productId, selectedVariant, variantIndex) {
  let variantKey

  if (selectedVariant && selectedVariant._id) {
    // Prioritize the variant's own _id if available and unique
    variantKey = selectedVariant._id.toString()
  } else if (selectedVariant && selectedVariant.size) {
    // Use size if _id is not available
    variantKey = selectedVariant.size
  } else if (selectedVariant && selectedVariant.weight) {
    // Use weight value and unit, ensuring unit is always a string
    variantKey = `${selectedVariant.weight.value}_${selectedVariant.weight.unit || ""}`
  } else {
    // Fallback to variant index if no other unique identifier is present
    variantKey = variantIndex.toString() // Ensure it's always a string
  }

  // Combine product ID with the variant-specific key for global uniqueness
  return `${productId}_${variantKey}`
}
