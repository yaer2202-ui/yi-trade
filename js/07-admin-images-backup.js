const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // מגבלת קובץ מקור: 12MB (לפני דחיסה)
const MAX_IMAGE_PIXELS = 50 * 1000 * 1000;  // מגבלת פיקסלים כדי לא לתקוע את הדפדפן
function compressProductImage(file, maxDim) {
  maxDim = Number(maxDim) > 1 ? Number(maxDim) : 1200;
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//i.test(file.type || '')) return reject(new Error('הקובץ שנבחר אינו תמונה'));
    if (file.size > MAX_UPLOAD_BYTES) return reject(new Error('התמונה גדולה מדי (מעל 12MB). נא לבחור תמונה קטנה יותר או לצמצם אותה לפני ההעלאה.'));
    // URL זמני במקום קריאה מלאה ל-Base64: חוסך זיכרון ולא תוקע את הדפדפן בקבצים גדולים
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('לא הצלחתי לקרוא את התמונה. נסי JPG או PNG רגילים (HEIC/WEBP מסוימים לא נתמכים).')); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!img.width || !img.height || img.width * img.height > MAX_IMAGE_PIXELS) return reject(new Error('הרזולוציה של התמונה גבוהה מדי. נא לצמצם אותה לפני ההעלאה.'));
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      // PNG שקוף היה הופך לשחור ב-JPEG – ממלאים רקע לבן קודם
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}
function renderAdminImagePreview() {
  const box = document.getElementById('adminImagePreview'); if (!box) return;
  const existing = adminExistingImages.map((src,index) => `<div style="position:relative"><img src="${escapeHTML(src)}" alt="תמונה קיימת ${index+1}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;"><button type="button" data-remove-admin-image="${index}" aria-label="הסרת תמונה ${index+1}" style="position:absolute;top:-6px;right:-6px;border:0;border-radius:50%;background:#b91c1c;color:white;width:22px;height:22px;cursor:pointer">×</button></div>`).join('');
  const staged = adminNewImagePreviews.map((src,index) => `<img src="${escapeHTML(src)}" alt="תמונה חדשה ${index+1}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;">`).join('');
  box.innerHTML = existing + staged + (adminExistingImages.length || adminNewImagePreviews.length ? '<small style="width:100%;color:#94a3b8">אפשר להסיר תמונות קיימות לפני השמירה. אפשר להוסיף עד 6 תמונות למוצר.</small>' : '');
}
document.getElementById('adminImagePreview')?.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-admin-image]');
  if (!button) return;
  adminExistingImages.splice(Number(button.dataset.removeAdminImage), 1);
  renderAdminImagePreview();
});
document.getElementById('adminPImages')?.addEventListener('change', event => {
  adminNewImagePreviews.forEach(src => URL.revokeObjectURL(src));
  adminNewImagePreviews = [...event.target.files].slice(0, Math.max(0, 6 - adminExistingImages.length)).map(file => URL.createObjectURL(file));
  renderAdminImagePreview();
});

function downloadCatalogBackup() {
  const backup={format:'yi-trade-catalog-backup',version:1,createdAt:new Date().toISOString(),userProducts,productOverrides,hiddenProductIds:[...hiddenProductIds]};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='yi-catalog-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('קובץ הגיבוי הורד למחשב');
}
async function restoreCatalogBackup(file) {
  if(!file)return;
  try {
    const data=JSON.parse(await file.text());
    if(data.format!=='yi-trade-catalog-backup'||!Array.isArray(data.userProducts)||!data.productOverrides||typeof data.productOverrides!=='object'||!Array.isArray(data.hiddenProductIds)) throw new Error('קובץ הגיבוי אינו מתאים');
    if(!confirm('השחזור יחליף את השינויים המקומיים בקטלוג. להמשיך?'))return;
    userProducts=sanitizeUserProducts(data.userProducts);
    productOverrides=sanitizeOverrides(data.productOverrides);hiddenProductIds=new Set(data.hiddenProductIds.filter(id=>typeof id==='string'));
    const cloudSaved = await persistCatalog();
    renderAdminList();
    if (cloudSaved) toast('הגיבוי שוחזר בהצלחה');
  } catch(error) { alert(error.message==='קובץ הגיבוי אינו מתאים'?'זה לא קובץ גיבוי מתאים של החנות.':'לא הצלחתי לקרוא את הגיבוי.'); }
}


