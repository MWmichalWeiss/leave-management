<div dir="rtl">

# DECISIONS

> מלאו את הקובץ הזה. הוא חלק מההערכה — קצר וברור עדיף על ארוך.

## 1. החלטות ארכיטקטוניות
- מסד נתונים: SQLite
- הפרדת שכבות: הוספתי שכבת Service (LeaveRequestService) שמכילה את הלוגיקה העסקית.
  Controller אחראי רק על קבלת בקשות HTTP והחזרת תשובות.
  לא הוספתי Repository נפרד כי DbContext כבר משמש כזה, והמשימה ביקשה להימנע מסיבוך מיותר.


## 2. הבאג ביתרת החופשה
- מה היה הבאג, איפה, ואיך תיקנתי:
  הבאג: המשתנה `used` חושב אבל לא נעשה בו שימוש בתנאי.
  איפה: LeaveRequestsController.cs, מתודת Create
  תיקון: שיניתי את התנאי ל-(used + days) > employee.AnnualQuota
  והוספתי ספירה של בקשות Pending בנוסף ל-Approved

- הטסט שמוכיח את התיקון:
  Create_ExceedsQuota_Fails ב-LeaveRequestsTests.cs
    if (dto.Type == LeaveType.Vacation && (used + days) > employee.AnnualQuota)



## 3. אישור בקשה (approve) ו‑concurrency
- איך טיפלתי במצבים לא חוקיים (כבר אושר / לא קיים):
  בקשה לא קיימת → 404 Not Found
  בקשה כבר אושרה/נדחתה → 400 Bad Request

- מה לגבי אישור של שתי בקשות במקביל:
  1. בדיקת מכסה ביצירת בקשה כוללת גם Pending - מונע יצירת בקשות שיחרגו
  2. Transaction באישור + בדיקת מכסה נוספת לפני אישור (שימוש ב-used, שורה X במתודת Approve)
  מגבלה: ב-SQLite אין נעילה ברמת השורה. ב-PostgreSQL אפשר FOR UPDATE להגנה מלאה

## 4. על מה ויתרתי בגלל הזמן
- ... ומה הייתי עושה עם עוד יום:
- ## 4. על מה ויתרתי בגלל הזמן
- לא השתמשתי ב-Docker כי העדפתי להספיק משימות במקום להתקין ולהגדיר
- לא השלמתי את משימה 3 בצד הקליינט (Angular):
  - העברת קריאות HTTP ל-Service ייעודי
  - החלפת any בטיפוסים מוגדרים
  - שיפור ניהול state ושימוש ב-RxJS
  - מניעת memory leaks וניקוי משאבים

- מה הייתי עושה עם עוד יום:
  - מעבר ל-Docker
  - השלמת משימה 3 בצד הקליינט
  - מעקב קפדני יותר אחרי הקוד של ה-AI


## 5. שימוש ב‑AI
### איפה AI עזר (כולל prompts)
1. prompt: "..." → מה קיבלתי ומה עשיתי איתו:
2. ...

### איפה דחיתי/תיקנתי הצעה של AI
- מה AI הציע, למה זה היה שגוי, ומה עשיתי במקום:
- ### דוגמה 1: תיקון באג במכסת ימי החופשה

**Prompt:** "Fix the vacation balance validation so requests cannot exceed the annual quota, and add an automated test. Do not modify code without my approval."

**מה קיבלתי ומה עשיתי:**

ה-AI זיהה שבמתודת `Create` המשתנה `used` לא נכלל בבדיקת המכסה. תיקנתי את התנאי כך שיתחשב בימים שנוצלו ובבקשה החדשה, כולל בקשות `Pending`, והוספתי את הטסט `Create_ExceedsQuota_Fails`.

### דוגמה 2: שיפור ארכיטקטורת ה-Backend

**Prompt:** "Check whether this is the right approach and tell me if I need to change anything in Visual Studio."

**מה קיבלתי ומה עשיתי:**

ה-AI המליץ להעביר את הלוגיקה העסקית ל-`Service`, ללא שכבת `Repository` מיותרת. לאחר אישורי, הוספתי `LeaveRequestService.cs`, רשמתי אותו ב-Dependency Injection ועדכנתי את ה-Controller, ללא שינוי בחוזה ה-API.

### דוגמה 3: שיפור טופס Angular

**Prompt:** "Review your suggestions, ask for permission before adding code, and divide the task into subtasks."

**מה קיבלתי ומה עשיתי:**

ה-AI חילק את העבודה לשלבים. הוספנו טופס Reactive Forms עם validation לתאריכים, טעינת עובדים מהשרת, טיפול בשגיאות ומצבי טעינה והצלחה. לאחר מכן בדקנו ושיפרנו את הטיפול בשגיאות ואת הודעות המשתמש.

### הצעת AI שתוקנה

במהלך מימוש אישור הבקשות, ה-AI הציע להשתמש ב-Transaction ובבדיקת מכסה בעת האישור. לאחר שבחנתי את ההצעה, התברר ש-Transaction רגיל אינו בהכרח מונע חריגות באישור בקשות מקבילות. לכן יש לתעד את המגבלה ולשקול מנגנון נעילה או בקרת concurrency המתאים למסד הנתונים.

### אבטחה
- אם מצאתם בעיית אבטחה: מה מצאתם, איפה (קובץ + שורה), למה זו בעיה, ואיך תיקנתם:
- מה מצאתי: SQL Injection
- איפה: LeaveRequestsController.cs (המקורי), מתודת Search, שורה 38
- למה זו בעיה: הפרמטר name מוכנס ישירות לשאילתת SQL בלי סניטציה. תוקף יכול להזין '; DROP TABLE Employees; -- ולמחוק את כל הטבלה
- איך תוקן: החלפה ל-LINQ ב-LeaveRequestService.cs במקום SQL גולמי


## 6. הוראות הרצה
- (אם שיניתם משהו מהוראות ה‑README המקורי)

</div>
