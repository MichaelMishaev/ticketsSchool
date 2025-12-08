# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8] [cursor=pointer]
  - alert [ref=e11]
  - generic [ref=e12]:
    - link "חזרה לדף הבית" [ref=e13] [cursor=pointer]:
      - /url: /
      - img [ref=e14] [cursor=pointer]
      - generic [ref=e17] [cursor=pointer]: חזרה לדף הבית
    - generic [ref=e18]:
      - generic [ref=e19]:
        - img [ref=e21]
        - heading "כניסת מנהלים" [level=2] [ref=e24]
        - paragraph [ref=e25]: kartis.info Admin Panel
      - generic [ref=e26]:
        - link "המשך עם Google" [ref=e28] [cursor=pointer]:
          - /url: /api/auth/google
          - img [ref=e29] [cursor=pointer]
          - text: המשך עם Google
        - generic [ref=e38]: או התחבר עם אימייל
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]: שם משתמש או אימייל
            - textbox "שם משתמש או אימייל" [ref=e43]
          - generic [ref=e44]:
            - generic [ref=e45]: סיסמה
            - textbox "סיסמה" [ref=e47]
          - button "התחבר" [ref=e49]
        - generic [ref=e50]:
          - link "שכחתי סיסמה" [ref=e51] [cursor=pointer]:
            - /url: /admin/forgot-password
          - link "הרשמה" [ref=e52] [cursor=pointer]:
            - /url: /admin/signup
```