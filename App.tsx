using UnityEngine;
using System.Collections;

public class UltimateGameTool : MonoBehaviour
{
    [Header("--- 1. إعدادات الطيران (Flight Module) ---")]
    public bool enableFly = true;
    public float flySpeed = 20f;

    [Header("--- 2. إعدادات التصويب الذكي (Smart Aim) ---")]
    public bool enableAim = true;
    public KeyCode aimKey = KeyCode.Mouse1; // زر الماوس الأيمن للتفعيل
    public float searchRadius = 50f;
    public float transitionSpeed = 15f;

    [Header("--- 3. إعدادات كشف الأماكن (ESP Overlay) ---")]
    public bool showESP = true;
    public Color espBoxColor = Color.cyan;

    private Camera cam;
    private bool isAiming = false;

    void Start()
    {
        cam = Camera.main;
        if (cam == null)
        {
            cam = GetComponent<Camera>();
        }
    }

    void Update()
    {
        // 1. تشغيل نظام الطيران
        if (enableFly)
        {
            HandleFlight();
        }

        // 2. تشغيل نظام التصويب عند الضغط على الزر المحدد
        if (enableAim && Input.GetKey(aimKey))
        {
            if (!isAiming)
            {
                StartCoroutine(ExecuteAimAssist());
            }
        }
    }

    // --- دالة حركة الطيران ---
    void HandleFlight()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 moveDir = (cam.transform.forward * v + cam.transform.right * h).normalized;

        if (Input.GetKey(KeyCode.Space)) moveDir += Vector3.up;
        if (Input.GetKey(KeyCode.LeftControl)) moveDir += Vector3.down;

        transform.position += moveDir * flySpeed * Time.deltaTime;

        Rigidbody rb = GetComponent<Rigidbody>();
        if (rb != null)
        {
            rb.velocity = Vector3.zero;
            rb.useGravity = false;
        }
    }

    // --- روتين التصويب السلس والتدريجي ---
    IEnumerator ExecuteAimAssist()
    {
        isAiming = true;
        Transform target = FindClosestTarget();

        if (target != null)
        {
            Vector3 dir = (target.position - cam.transform.position).normalized;
            Quaternion targetRot = Quaternion.LookRotation(dir);

            float elapsed = 0f;
            while (elapsed < 0.1f)
            {
                cam.transform.rotation = Quaternion.Slerp(cam.transform.rotation, targetRot, elapsed * transitionSpeed);
                elapsed += Time.deltaTime;
                yield return null;
            }
        }

        isAiming = false;
    }

    // --- البحث عن أقرب هدف في النطاق ---
    Transform FindClosestTarget()
    {
        Collider[] hits = Physics.OverlapSphere(transform.position, searchRadius);
        Transform closest = null;
        float minDist = Mathf.Infinity;

        foreach (var hit in hits)
        {
            if (hit.CompareTag("Enemy") || hit.gameObject.name.Contains("Target") || hit.gameObject.name.Contains("Enemy"))
            {
                float dist = Vector3.Distance(transform.position, hit.transform.position);
                if (dist < minDist)
                {
                    minDist = dist;
                    closest = hit.transform;
                }
            }
        }
        return closest;
    }

    // --- رسم صناديق التتبع على الشاشة (ESP) ---
    void OnGUI()
    {
        if (!showESP) return;

        Collider[] targets = Physics.OverlapSphere(transform.position, searchRadius);
        foreach (var target in targets)
        {
            if (target.CompareTag("Enemy") || target.gameObject.name.Contains("Target") || target.gameObject.name.Contains("Enemy"))
            {
                Vector3 screenPos = cam.WorldToScreenPoint(target.transform.position);

                if (screenPos.z > 0)
                {
                    float width = 45f;
                    float height = 90f;
                    float posY = Screen.height - screenPos.y - (height / 2);

                    GUI.color = espBoxColor;
                    GUI.Box(new Rect(screenPos.x - (width / 2), posY, width, height), "Target");
                }
            }
        }
    }
}