const vs = `
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  gl_Position = v_position;
}
`;
const fs = `
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;

uniform vec4 u_lightColor;
uniform vec4 u_diffuseMult;
uniform sampler2D u_diffuse;

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord) * u_diffuseMult;
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  float lit = abs(dot(a_normal, surfaceToLight));
  gl_FragColor = vec4(diffuseColor.rgb * lit, diffuseColor.a);
  gl_FragColor.rgb *= gl_FragColor.a;
}
`;