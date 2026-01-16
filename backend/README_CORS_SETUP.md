# CORS Configuration Setup Guide

## Overview

This CORS configuration resolves CORS preflight errors when the frontend (running on `http://localhost:3000` or `http://192.168.206.1:3000`) makes requests to the Spring Boot backend API.

## File Location

Copy the file `CorsConfig.java` to your Spring Boot project at:

```
src/main/java/com/movasafe/config/CorsConfig.java
```

**Important:** Adjust the package name (`com.movasafe.config`) to match your actual package structure.

## Implementation Steps

### 1. Copy the Configuration File

Copy `CorsConfig.java` to your Spring Boot project's config package.

### 2. Update Package Name (if needed)

If your package structure is different, update the package declaration:

```java
package your.actual.package.name.config;
```

### 3. Verify Spring Boot Auto-Configuration

Ensure your Spring Boot application can detect this configuration:

- The class is in a package that's scanned by `@ComponentScan`
- Or it's in the same package as your `@SpringBootApplication` class
- Or explicitly include it in component scanning

### 4. Rebuild and Redeploy

```bash
# Build the project
./mvnw clean package

# Or with Gradle
./gradlew clean build

# Redeploy to AWS Elastic Beanstalk
eb deploy
```

## Configuration Details

### Allowed Origins
- `http://localhost:3000` - Local development
- `http://192.168.206.1:3000` - Network access from other devices

### Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS, PATCH

### Security Features
- ✅ Specific origins (not wildcard `*`)
- ✅ Credentials enabled for authenticated requests
- ✅ Preflight caching (3600 seconds)
- ✅ All headers allowed

## Testing

### 1. Check Preflight Request

Open browser DevTools → Network tab → Look for OPTIONS request to `/api/auth/open/signin`

**Expected Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

### 2. Test Login

Try logging in from the frontend. The POST request should succeed without CORS errors.

### 3. Verify in Console

Check browser console - there should be no CORS errors like:
- ❌ `No 'Access-Control-Allow-Origin' header`
- ❌ `CORS policy blocked`
- ❌ `Preflight request failed`

## Troubleshooting

### Issue: CORS still not working

**Solution 1:** Verify the configuration class is being loaded
- Add a `@PostConstruct` method with a log statement
- Check application logs on startup

**Solution 2:** Check for conflicting CORS configurations
- Remove any `@CrossOrigin` annotations on controllers (if using global config)
- Remove any other CORS filter configurations

**Solution 3:** Verify Spring Security (if using)
- If using Spring Security, you may need to configure CORS there as well:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and() // Enable CORS
            // ... other security config
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://192.168.206.1:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### Issue: 403 Forbidden on OPTIONS request

**Solution:** If using Spring Security, ensure OPTIONS requests are allowed:

```java
http.cors().and()
    .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        // ... other rules
    );
```

## Production Considerations

For production, update the allowed origins to include your production frontend URL:

```java
.allowedOrigins(
    "http://localhost:3000",
    "http://192.168.206.1:3000",
    "https://your-production-domain.com"  // Add production URL
)
```

Or use environment variables:

```java
@Value("${cors.allowed.origins}")
private String[] allowedOrigins;

// Then in addCorsMappings:
.allowedOrigins(allowedOrigins)
```

## Additional Resources

- [Spring CORS Documentation](https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
