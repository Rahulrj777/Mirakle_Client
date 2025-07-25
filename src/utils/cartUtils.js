// This function ensures consistent variant ID generation across frontend and backend.
// It prioritizes size/weight as primary variant identifiers, falling back to _id if available, then index.
export function generateVariantId(productId, selectedVariant, variantIndex) {
  if (!productId) {
    console.error("generateVariantId: productId is undefined or null.")
    return `INVALID_PRODUCT_ID_${Math.random().toString(36).substring(7)}`
  }
  if (!selectedVariant) {
    console.error(`generateVariantId: selectedVariant is undefined or null for product ${productId}.`)
    return `${productId}_INVALID_VARIANT_${Math.random().toString(36).substring(7)}`
  }

  let variantKey = ""

  // Prioritize size or weight for variant identification, ensuring string conversion, trimming, and lowercasing
  if (selectedVariant.size) {
    variantKey = String(selectedVariant.size).trim().toLowerCase()
    console.log(`generateVariantId: Using size '${variantKey}' for product ${productId}.`)
  } else if (selectedVariant.weight && selectedVariant.weight.value !== undefined) {
    const weightValue = String(selectedVariant.weight.value).trim().toLowerCase()
    const weightUnit = String(selectedVariant.weight.unit || "")
      .trim()
      .toLowerCase() // Ensure unit is also string, trimmed, lowercased
    variantKey = `${weightValue}_${weightUnit}`
    console.log(`generateVariantId: Using weight '${variantKey}' for product ${productId}.`)
  } else if (selectedVariant._id) {
    // Fallback to variant's own _id if size/weight not present
    variantKey = String(selectedVariant._id)
    console.log(`generateVariantId: Using variant _id '${variantKey}' for product ${productId}.`)
  } else {
    // Final fallback to variant index (less reliable if product variants can change order, but necessary if no other unique ID)
    variantKey = String(variantIndex)
    console.warn(
      `generateVariantId: Falling back to variant index '${variantKey}' for product ${productId}. Consider adding unique size/weight or _id to variants.`,
    )
  }

  const finalVariantId = `${String(productId).trim()}_${variantKey}` // Ensure productId is also a string and trimmed
  console.log(`generateVariantId: Final ID for product ${productId}: ${finalVariantId}`)
  return finalVariantId
}
