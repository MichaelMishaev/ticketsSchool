# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8] [cursor=pointer]
  - alert [ref=e13]
  - generic [ref=e14]:
    - link "חזרה לדף הבית" [ref=e15]:
      - /url: /
      - img [ref=e16]
      - generic [ref=e19]: חזרה לדף הבית
    - generic [ref=e20]:
      - generic [ref=e21]:
        - img [ref=e23]
        - heading "כניסת מנהלים" [level=2] [ref=e26]
        - paragraph [ref=e27]: kartis.info Admin Panel
      - generic [ref=e28]:
        - link "המשך עם Google" [ref=e30]:
          - /url: /api/auth/google
          - img [ref=e31]
          - text: המשך עם Google
        - generic [ref=e40]: או התחבר עם אימייל
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]: שם משתמש או אימייל
            - textbox "שם משתמש או אימייל" [ref=e45]
          - generic [ref=e46]:
            - generic [ref=e47]: סיסמה
            - textbox "סיסמה" [ref=e49]
          - button "התחבר" [ref=e51]
        - generic [ref=e52]:
          - link "שכחתי סיסמה" [ref=e53] [cursor=pointer]:
            - /url: /admin/forgot-password
          - link "הרשמה" [ref=e54] [cursor=pointer]:
            - /url: /admin/signup
```