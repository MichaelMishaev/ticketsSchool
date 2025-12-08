# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "חזרה לדף הבית" [ref=e3]:
      - /url: /
      - img [ref=e4]
      - generic [ref=e7]: חזרה לדף הבית
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img [ref=e11]
        - heading "כניסת מנהלים" [level=2] [ref=e14]
        - paragraph [ref=e15]: kartis.info Admin Panel
      - generic [ref=e16]:
        - generic [ref=e18]:
          - img [ref=e19]
          - paragraph [ref=e21]: אימייל או סיסמה שגויים
        - link "המשך עם Google" [ref=e23]:
          - /url: /api/auth/google
          - img [ref=e24]
          - text: המשך עם Google
        - generic [ref=e33]: או התחבר עם אימייל
        - generic [ref=e34]:
          - generic [ref=e35]:
            - generic [ref=e36]: שם משתמש או אימייל
            - textbox "שם משתמש או אימייל" [ref=e38]: export-a-1765186674662-y8ccr6@test.com
          - generic [ref=e39]:
            - generic [ref=e40]: סיסמה
            - textbox "סיסמה" [ref=e42]: TestPassword123!
          - button "התחבר" [ref=e44]
        - generic [ref=e45]:
          - link "שכחתי סיסמה" [ref=e46] [cursor=pointer]:
            - /url: /admin/forgot-password
          - link "הרשמה" [ref=e47] [cursor=pointer]:
            - /url: /admin/signup
  - button "Open Next.js Dev Tools" [ref=e53] [cursor=pointer]:
    - img [ref=e54] [cursor=pointer]
  - alert [ref=e59]
```