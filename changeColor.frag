precision mediump float;

uniform sampler2D tex;
uniform sampler2D maskTex;
uniform float strength;
uniform vec3 color;

varying vec2 vTexCoord;

void main(){

    vec4 col = texture2D(tex, vTexCoord);
    float mask = texture2D(maskTex, vTexCoord).r;

    col.rgb = mix(col.rgb, color, mask * strength);

    gl_FragColor = col;
}