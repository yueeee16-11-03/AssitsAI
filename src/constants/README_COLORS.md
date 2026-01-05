# 🎨 Color System - Professional & Modern

Hệ thống màu sắc chuyên nghiệp và hiện đại cho ứng dụng Assist.

## 📦 Import

```typescript
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/colors';
```

## 🎨 Color Palette

### Primary Colors (Màu chính)
Màu teal/cyan hiện đại, chuyên nghiệp
```typescript
COLORS.primary.main        // '#00897B' - Màu chính
COLORS.primary.light       // '#26C6DA' - Màu sáng
COLORS.primary.dark        // '#00695C' - Màu tối
COLORS.primary.gradient    // ['#00897B', '#26C6DA'] - Gradient
COLORS.primary.background  // 'rgba(0, 137, 123, 0.08)' - Background nhạt
COLORS.primary.hover       // 'rgba(0, 137, 123, 0.12)' - Hover state
```

### Success Colors (Thu nhập)
Màu xanh lá cho thu nhập và trạng thái thành công
```typescript
COLORS.success.main        // '#10B981'
COLORS.success.light       // '#34D399'
COLORS.success.dark        // '#059669'
COLORS.success.background  // 'rgba(16, 185, 129, 0.12)'
COLORS.success.hover       // 'rgba(16, 185, 129, 0.2)'
```

### Error Colors (Chi tiêu)
Màu đỏ cho chi tiêu và trạng thái lỗi
```typescript
COLORS.error.main          // '#EF4444'
COLORS.error.light         // '#F87171'
COLORS.error.dark          // '#DC2626'
COLORS.error.background    // 'rgba(239, 68, 68, 0.12)'
COLORS.error.hover         // 'rgba(239, 68, 68, 0.2)'
```

### Warning Colors
```typescript
COLORS.warning.main        // '#F59E0B'
COLORS.warning.light       // '#FCD34D'
COLORS.warning.dark        // '#D97706'
COLORS.warning.background  // 'rgba(245, 158, 11, 0.12)'
```

### Info Colors
```typescript
COLORS.info.main           // '#3B82F6'
COLORS.info.light          // '#60A5FA'
COLORS.info.dark           // '#2563EB'
COLORS.info.background     // 'rgba(59, 130, 246, 0.12)'
```

### Category Colors (Màu danh mục)
```typescript
COLORS.category.food           // '#FF6B6B' - Ăn uống
COLORS.category.transport      // '#4ECDC4' - Giao thông
COLORS.category.shopping       // '#FFD93D' - Mua sắm
COLORS.category.entertainment  // '#95E1D3' - Giải trí
COLORS.category.health         // '#FF85C0' - Sức khỏe
COLORS.category.education      // '#B5EAD7' - Học tập
COLORS.category.utilities      // '#FFD6BA' - Điện nước
COLORS.category.internet       // '#C7CEEA' - Internet
COLORS.category.home           // '#E2A76F' - Nhà cửa
COLORS.category.other          // '#6366F1' - Khác
```

### Neutral Colors (Màu trung tính)
```typescript
COLORS.neutral[50]   // '#FAFAFA' - Rất sáng
COLORS.neutral[100]  // '#F5F5F5'
COLORS.neutral[200]  // '#E5E5E5'
COLORS.neutral[300]  // '#D4D4D4'
COLORS.neutral[400]  // '#A3A3A3'
COLORS.neutral[500]  // '#737373' - Giữa
COLORS.neutral[600]  // '#525252'
COLORS.neutral[700]  // '#404040'
COLORS.neutral[800]  // '#262626'
COLORS.neutral[900]  // '#171717' - Rất tối
```

### Transparent Colors (Màu trong suốt)
```typescript
COLORS.transparent.white[5]   // 'rgba(255, 255, 255, 0.05)'
COLORS.transparent.white[8]   // 'rgba(255, 255, 255, 0.08)'
COLORS.transparent.white[10]  // 'rgba(255, 255, 255, 0.10)'
COLORS.transparent.white[20]  // 'rgba(255, 255, 255, 0.20)'
COLORS.transparent.white[85]  // 'rgba(255, 255, 255, 0.85)'
COLORS.transparent.white[90]  // 'rgba(255, 255, 255, 0.90)'

COLORS.transparent.black[3]   // 'rgba(0, 0, 0, 0.03)'
COLORS.transparent.black[5]   // 'rgba(0, 0, 0, 0.05)'
COLORS.transparent.black[8]   // 'rgba(0, 0, 0, 0.08)'
COLORS.transparent.black[10]  // 'rgba(0, 0, 0, 0.10)'
COLORS.transparent.black[12]  // 'rgba(0, 0, 0, 0.12)'
```

## 📝 Typography

### Font Sizes
```typescript
TYPOGRAPHY.fontSize.xs    // 11
TYPOGRAPHY.fontSize.sm    // 12
TYPOGRAPHY.fontSize.base  // 14
TYPOGRAPHY.fontSize.md    // 15
TYPOGRAPHY.fontSize.lg    // 16
TYPOGRAPHY.fontSize.xl    // 18
TYPOGRAPHY.fontSize['2xl'] // 20
TYPOGRAPHY.fontSize['3xl'] // 24
TYPOGRAPHY.fontSize['4xl'] // 32
TYPOGRAPHY.fontSize['5xl'] // 36
```

### Font Weights
```typescript
TYPOGRAPHY.fontWeight.normal    // '400'
TYPOGRAPHY.fontWeight.medium    // '500'
TYPOGRAPHY.fontWeight.semibold  // '600'
TYPOGRAPHY.fontWeight.bold      // '700'
TYPOGRAPHY.fontWeight.extrabold // '800'
TYPOGRAPHY.fontWeight.black     // '900'
```

### Letter Spacing
```typescript
TYPOGRAPHY.letterSpacing.tight  // -0.5
TYPOGRAPHY.letterSpacing.normal // 0
TYPOGRAPHY.letterSpacing.wide   // 0.3
TYPOGRAPHY.letterSpacing.wider  // 0.5
```

## 📏 Spacing
```typescript
SPACING.xs    // 4
SPACING.sm    // 8
SPACING.md    // 12
SPACING.base  // 16
SPACING.lg    // 20
SPACING.xl    // 24
SPACING['2xl'] // 32
SPACING['3xl'] // 40
SPACING['4xl'] // 48
```

## 🔲 Border Radius
```typescript
BORDER_RADIUS.sm   // 8
BORDER_RADIUS.md   // 12
BORDER_RADIUS.lg   // 16
BORDER_RADIUS.xl   // 20
BORDER_RADIUS['2xl'] // 24
BORDER_RADIUS.full   // 9999 (fully rounded)
```

## 🌑 Shadows
```typescript
SHADOWS.sm  // Small shadow (elevation: 1)
SHADOWS.md  // Medium shadow (elevation: 2)
SHADOWS.lg  // Large shadow (elevation: 4)
SHADOWS.xl  // Extra large shadow (elevation: 8)
```

## 💡 Usage Examples

### Button with primary color
```typescript
const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary.main,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    ...SHADOWS.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
});
```

### Card with gradient
```typescript
<LinearGradient
  colors={[...COLORS.primary.gradient]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.card}
>
  {/* Content */}
</LinearGradient>
```

### Income/Expense indicators
```typescript
const amountColor = isIncome ? COLORS.success.main : COLORS.error.main;
const backgroundColor = isIncome ? COLORS.success.background : COLORS.error.background;

const styles = StyleSheet.create({
  badge: {
    backgroundColor,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    color: amountColor,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
```

### Dark mode support
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.dark 
      ? COLORS.transparent.white[5]
      : COLORS.transparent.black[3],
  },
});
```

## 🎯 Best Practices

1. **Luôn sử dụng constants thay vì hardcode màu**
   ```typescript
   // ✅ Good
   color: COLORS.primary.main
   
   // ❌ Bad
   color: '#00897B'
   ```

2. **Sử dụng semantic colors**
   ```typescript
   // ✅ Good - Ý nghĩa rõ ràng
   color: COLORS.success.main  // cho thu nhập
   color: COLORS.error.main    // cho chi tiêu
   
   // ❌ Bad - Không rõ ý nghĩa
   color: '#10B981'
   color: '#EF4444'
   ```

3. **Sử dụng typography constants**
   ```typescript
   // ✅ Good
   fontSize: TYPOGRAPHY.fontSize.lg,
   fontWeight: TYPOGRAPHY.fontWeight.bold,
   
   // ❌ Bad
   fontSize: 16,
   fontWeight: '700',
   ```

4. **Sử dụng SHADOWS thay vì custom shadows**
   ```typescript
   // ✅ Good
   ...SHADOWS.md
   
   // ❌ Bad
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.08,
   shadowRadius: 4,
   elevation: 2,
   ```

## 🔄 Migration Guide

Để migrate code cũ sang hệ thống màu mới:

1. Import constants:
   ```typescript
   import { COLORS, TYPOGRAPHY } from '@/constants/colors';
   ```

2. Thay thế hardcoded colors:
   - `#00897B` → `COLORS.primary.main`
   - `#10B981` → `COLORS.success.main`
   - `#EF4444` → `COLORS.error.main`
   - `#FFFFFF` → `COLORS.white`

3. Thay thế font sizes và weights:
   - `fontSize: 16` → `fontSize: TYPOGRAPHY.fontSize.lg`
   - `fontWeight: '700'` → `fontWeight: TYPOGRAPHY.fontWeight.bold`

4. Sử dụng shadow presets:
   - Custom shadow objects → `...SHADOWS.md`
