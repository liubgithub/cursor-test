
uniform float time;
uniform vec2 resolution;
uniform sampler2D waterNormals;

varying vec2 vUv;

void main() {
    // 基础颜色
    vec3 baseColor = vec3(0.1, 0.3, 0.8);
    
    // 法线贴图扰动
    vec2 uv = vUv * 2.0;
    uv.x += time * 0.05;
    uv.y += time * 0.03;
    vec3 normal = texture2D(waterNormals, uv).xyz * 2.0 - 1.0;
    
    // 光照计算
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // 波纹效果
    float ripple = sin(vUv.x * 20.0 + time * 2.0) * 0.1;
    ripple += sin(vUv.y * 15.0 + time * 1.5) * 0.08;
    
    // 最终颜色
    vec3 color = baseColor * (0.7 + 0.3 * diffuse);
    color += ripple * 0.3;
    color = mix(color, vec3(1.0), 0.2 * (1.0 - diffuse));
    
    gl_FragColor = vec4(color, 0.8);
}
