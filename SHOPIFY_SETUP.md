# Lily Makes Resin Art Shopify Theme Setup

## 1. Push the theme to GitHub

1. Create a new GitHub repository for the Shopify theme.
2. Commit the Shopify theme directories from this workspace:
   - `layout/`
   - `templates/`
   - `sections/`
   - `snippets/`
   - `assets/theme.css`
   - `assets/theme.js`
   - `assets/lmra-*.svg`
   - `config/`
3. Push to GitHub:

```bash
git add layout templates sections snippets assets/theme.css assets/theme.js assets/lmra-*.svg config SHOPIFY_SETUP.md
git commit -m "Add Lily Makes Resin Art Shopify theme"
git push origin main
```

## 2. Connect GitHub to Shopify

1. In Shopify admin, go to `Online Store > Themes`.
2. Click `Add theme > Connect from GitHub`.
3. Authorize Shopify to access the repository.
4. Select the repository and branch that contains this theme.
5. Shopify will sync the theme as an unpublished theme.

## 3. Add the product in Shopify

Create a product with these values:

- Title: `Lily's Art | Monster Resin Glow Lamp`
- Price: `$89.95`
- Compare-at price: `$129.95`
- Variants:
  - Option name: `Size`
  - Values: `Small`, `Large`
- Product type or tag: optional, for catalog organization.

Assign the product template:

1. Open the product in Shopify admin.
2. In `Theme template`, choose the product template from this theme.
3. In the theme customizer, open the product page and confirm the `Product hero` section is using the real product.

Bundle note: Shopify themes cannot change checkout prices by themselves. The `Buy 2` option adds quantity `2` and displays `$161.91`; configure an automatic Shopify discount or discount app for the actual checkout price.

## 4. Replace placeholder images

Placeholder images are stored as original SVG assets named `assets/lmra-*.svg`.

Replace them through the theme customizer:

1. Go to `Online Store > Themes > Customize`.
2. Open the home or product page.
3. In `Product hero`, replace each `Gallery image` block.
4. In `Testimonials`, replace each testimonial image.
5. In `Before and after`, replace the before and after image pickers.
6. In `Footer`, replace the footer image if desired.

You can also upload real product images directly to the Shopify product. The catalog card will use the product featured image automatically.

## 5. Publish the theme

1. Preview the synced theme from `Online Store > Themes`.
2. Test:
   - Product gallery thumbnails
   - Size selection
   - Buy 1 and Buy 2 bundle selection
   - Add to cart
   - Cart drawer quantity changes and checkout button
   - Contact form
   - Mobile layout
3. When ready, click `Publish` on the theme in Shopify admin.
